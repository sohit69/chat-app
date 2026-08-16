import React, { useState } from "react";
import { Avatar, Stack, Typography, Button, TextField } from "@mui/material";
import { transformImage } from "../../lib/features";

const Profile = ({ user }) => {
  const [editMode, setEditMode] = useState(false);
  const [name, setName] = useState(user?.name || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
  };

  const handleUpdate = async () => {
  console.log("BUTTON CLICKED ✅");

  const formData = new FormData();
  formData.append("name", name);
  formData.append("bio", bio);
  if (file) formData.append("avatar", file);

  try {
    console.log("SENDING REQUEST...");

    const res = await fetch(
      "http://localhost:5000/api/v1/user/update-profile",
      {
        method: "PUT",
        body: formData,
        credentials: "include",
      }
    );

    console.log("RESPONSE RECEIVED:", res);

    const data = await res.json();
    console.log("DATA:", data);

    alert("Profile Updated ✅");

    setEditMode(false);
  } catch (err) {
    console.log("ERROR:", err);
  }
};
  return (
    <Stack spacing={2} alignItems="center">

      {/* Avatar */}
      <Avatar
        src={
          preview
            ? preview
            : typeof user?.avatar === "string"
            ? transformImage(user.avatar)
            : user?.avatar?.url
            ? transformImage(user.avatar.url)
            : ""
        }
        sx={{ width: 120, height: 120 }}
      />

      {!editMode ? (
        <>
          {/* NORMAL UI (SAME AS YOUR IMAGE) */}
          <Typography variant="h6">{user?.name}</Typography>
          <Typography color="gray">Bio</Typography>
          <Typography>{user?.bio}</Typography>

          <Typography color="gray">@{user?.username}</Typography>
          <Typography color="gray">{user?.name}</Typography>

          <Typography color="gray">Joined</Typography>

          {/* 🔥 BUTTON YOU WANTED */}
          <Button
            variant="contained"
            onClick={() => setEditMode(true)}
          >
            Update Profile
          </Button>
        </>
      ) : (
        <>
          {/* EDIT MODE */}
          <TextField
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            fullWidth
          />

          <TextField
            label="Bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            fullWidth
            multiline
          />

          <input type="file" onChange={handleFileChange} />

          <Button variant="contained" onClick={handleUpdate}>
            Save Changes
          </Button>

          <Button color="error" onClick={() => setEditMode(false)}>
            Cancel
          </Button>
        </>
      )}
    </Stack>
  );
};

export default Profile;