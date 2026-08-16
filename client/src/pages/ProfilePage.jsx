import React, { useState, useRef, useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/button";
import { Camera, Lock, Save, User as UserIcon, Mail, Phone, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";

function ProfilePage() {
  const { user, updateProfile, loading } = useAuthStore();

  const [name, setName] = useState(user?.name || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(user?.avatar?.url || "");
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setBio(user.bio || "");
      setPreviewUrl(user.avatar?.url || "");
    }
  }, [user]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image file size should be less than 10MB.");
      return;
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  const handleSave = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Name cannot be empty.");
      return;
    }

    const formData = new FormData();
    formData.append("name", name.trim());
    formData.append("bio", bio.trim());
    if (selectedFile) {
      formData.append("avatar", selectedFile);
    }

    const res = await updateProfile(formData);
    if (res.success) {
      toast.success(res.message || "Profile updated successfully!");
      setSelectedFile(null);
    } else {
      toast.error(res.message || "Failed to update profile.");
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="rounded-3xl border border-border bg-card/70 backdrop-blur-md p-6 sm:p-8 shadow-xl">
        <div className="border-b border-border pb-6 mb-6">
          <h1 className="text-2xl font-bold tracking-tight">User Profile</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your personal profile information and profile photo.
          </p>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          {/* Avatar Upload Section */}
          <div className="flex flex-col items-center justify-center space-y-3 pb-2">
            <div className="relative group">
              <div className="relative flex h-28 w-28 items-center justify-center rounded-full bg-primary/15 font-bold text-3xl text-primary overflow-hidden border-4 border-background shadow-md">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt={name || "User Avatar"}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span>{name?.[0]?.toUpperCase() || "U"}</span>
                )}
              </div>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 rounded-full bg-primary p-2.5 text-primary-foreground shadow-lg transition hover:scale-110 active:scale-95 cursor-pointer"
                title="Upload Profile Picture"
              >
                <Camera size={18} />
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
            <p className="text-xs text-muted-foreground font-medium">
              Click camera icon to change profile picture
            </p>
          </div>

          {/* Editable Fields */}
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5 mb-1.5">
                <UserIcon size={14} className="text-primary" />
                <span>Full Name</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
                className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm focus:outline-hidden focus:ring-2 focus:ring-primary/40 transition"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5 mb-1.5">
                <FileText size={14} className="text-primary" />
                <span>Bio / About</span>
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Write something about yourself..."
                rows={3}
                className="w-full rounded-xl border border-input bg-background p-3 text-sm focus:outline-hidden focus:ring-2 focus:ring-primary/40 resize-none transition"
              />
            </div>

            {/* Non-Editable (Read-Only) Fields */}
            <div className="pt-2 border-t border-border/60 space-y-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground flex items-center justify-between mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <Mail size={14} className="text-muted-foreground" />
                    <span>Email Address</span>
                  </span>
                  <span className="text-[11px] text-amber-500 font-normal flex items-center gap-1">
                    <Lock size={12} /> Email cannot be modified
                  </span>
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={user?.email || ""}
                    disabled
                    readOnly
                    className="w-full rounded-xl border border-border bg-muted/60 px-4 py-2.5 text-sm text-muted-foreground cursor-not-allowed select-none opacity-80"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground flex items-center justify-between mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <Phone size={14} className="text-muted-foreground" />
                    <span>Mobile Number</span>
                  </span>
                  <span className="text-[11px] text-amber-500 font-normal flex items-center gap-1">
                    <Lock size={12} /> Mobile number cannot be modified
                  </span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={user?.phoneNumber || "Not provided"}
                    disabled
                    readOnly
                    className="w-full rounded-xl border border-border bg-muted/60 px-4 py-2.5 text-sm text-muted-foreground cursor-not-allowed select-none opacity-80"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <Button
              type="submit"
              disabled={loading}
              className="gap-2 px-6 py-2.5 rounded-xl font-semibold shadow-md cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Saving Changes...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>Save Profile</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ProfilePage;
