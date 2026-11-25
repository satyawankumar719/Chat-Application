import React, { useState, useRef, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { useForm } from "react-hook-form";
import axios from "axios";
import { messageApi } from "@/api/messageApi";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/button";
import type { AppLayoutContext } from "@/components/layout/AppLayout";
import {
  Camera,
  Lock,
  Save,
  User as UserIcon,
  Mail,
  Phone,
  FileText,
  Loader2,
  LogOut,
} from "lucide-react";
import { toast } from "sonner";

export interface ProfileFormData {
  name: string;
  bio: string;
}

function ProfilePage() {
  const { user, updateProfile, loading } = useAuthStore();
  const { requestLogout } = useOutletContext<AppLayoutContext>();

  const avatarUrl = typeof user?.avatar === "string" ? user.avatar : user?.avatar?.url;
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState(avatarUrl || "");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<ProfileFormData>({
    defaultValues: {
      name: user?.name || "",
      bio: user?.bio || "",
    },
  });

  const watchedName = watch("name");

  useEffect(() => {
    if (user) {
      reset({
        name: user.name || "",
        bio: user.bio || "",
      });
      const url = typeof user.avatar === "string" ? user.avatar : user.avatar?.url;
      setPreviewUrl(url || "");
    }
  }, [user, reset]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const handleSave = async (data: ProfileFormData) => {
    if (!data.name.trim()) {
      toast.error("Name cannot be empty.");
      return;
    }

    let avatarUrl: string | undefined = undefined;
    let avatarKey: string | undefined = undefined;

    if (selectedFile) {
      try {
        const presignedRes = await messageApi.getPresignedUrl({
          fileName: selectedFile.name,
          fileType: selectedFile.type || "image/jpeg",
          folder: "avatars",
        });

        const presignedData = presignedRes.data?.data;
        if (presignedData?.uploadUrl) {
          await axios.put(presignedData.uploadUrl, selectedFile, {
            headers: {
              "Content-Type": selectedFile.type || "image/jpeg",
            },
          });
          avatarUrl = presignedData.fileUrl;
          avatarKey = presignedData.key;
        } else {
          toast.error("Failed to obtain S3 presigned URL.");
          return;
        }
      } catch (e: any) {
        console.error("S3 upload error:", e);
        const errMsg = e.response?.data?.message || e.message || "Failed to upload file to S3";
        toast.error(`AWS S3 Upload Error: ${errMsg}`);
        return;
      }
    }

    const res = await updateProfile({
      name: data.name.trim(),
      bio: (data.bio || "").trim(),
      avatarUrl,
      avatarKey,
    });

    if (res.success) {
      toast.success(res.message || "Profile updated successfully!");
      setSelectedFile(null);
    } else {
      toast.error(res.message || "Failed to update profile.");
    }
  };

  return (
    <div className="h-full w-full overflow-y-auto px-4 py-6 sm:px-8 sm:py-10">
      <div className="max-w-2xl mx-auto">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-8">
          <div className="border-b border-border pb-6 mb-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Profile</h1>
              <Button
                type="button"
                variant="destructive"
                onClick={requestLogout}
                aria-haspopup="dialog"
                className="min-h-11 gap-2 rounded-xl border-destructive/25 px-3.5 md:hidden"
              >
                <LogOut aria-hidden="true" className="size-4" />
                Log out
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Manage your personal profile information and profile photo.
            </p>
          </div>

          <form onSubmit={handleSubmit(handleSave)} className="space-y-6">
            <div className="flex flex-col items-center justify-center space-y-3 pb-2">
              <div className="relative group">
                <div className="relative flex h-28 w-28 items-center justify-center rounded-full bg-primary/15 font-bold text-3xl text-primary overflow-hidden border-4 border-background shadow-md">
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt={watchedName || "User Avatar"}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span>{watchedName?.[0]?.toUpperCase() || "U"}</span>
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

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5 mb-1.5">
                  <UserIcon size={14} className="text-primary" />
                  <span>Full Name</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter your full name"
                  {...register("name", { required: "Name cannot be empty" })}
                  className={`w-full rounded-xl border bg-background px-4 py-2.5 text-sm focus:outline-hidden focus:ring-2 focus:ring-primary/40 transition ${
                    errors.name ? "border-red-500 focus:ring-red-500" : "border-input"
                  }`}
                />
                {errors.name && (
                  <p className="text-xs text-red-500 font-medium mt-1">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5 mb-1.5">
                  <FileText size={14} className="text-primary" />
                  <span>Bio / About</span>
                </label>
                <textarea
                  placeholder="Write something about yourself..."
                  rows={3}
                  {...register("bio")}
                  className="w-full rounded-xl border border-input bg-background p-3 text-sm focus:outline-hidden focus:ring-2 focus:ring-primary/40 resize-none transition"
                />
              </div>

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
                className="min-h-11 w-full gap-2 rounded-xl px-6 font-semibold sm:w-auto"
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
    </div>
  );
}

export default ProfilePage;
