import React, { useRef, useState } from "react";
import { Send, Paperclip, X, Loader2 } from "lucide-react";
import { messageApi } from "@/api/messageApi";
import { useSocketStore } from "@/store/socketStore";

function MessageInput({
  chat,
  onSendMessage,
  
}) {
  const [draft, setDraft] = useState("");
  const [files, setFiles] = useState([]);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [error,setError] = useState("");

  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const { socket } = useSocketStore();


  const handleTyping = () => {
    if (!socket || !chat?._id) return;

    socket.emit("typing", {
      chatId: chat._id,
      typing: true,
    });

    clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("typing", {
        chatId: chat._id,
        typing: false,
      });
    }, 1000);
  };


  const handleInput = (e) => {
    handleTyping();
    setDraft(e.target.value);
  };


const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB

const allowedTypes = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "video/mp4",
];


const handleFileSelect = (e) => {

  const selectedFiles = Array.from(e.target.files);

  const validFiles = [];
  const errors = [];


  selectedFiles.forEach((file) => {

    if (!allowedTypes.includes(file.type)) {
      errors.push(
        `${file.name}: File type not supported`
      );
      return;
    }


    if (file.size > MAX_FILE_SIZE) {
      errors.push(
        `${file.name}: File size must be less than 25MB`
      );
      return;
    }


    validFiles.push({
      file,
      preview: URL.createObjectURL(file),
    });

  });

  if(errors.length > 0){
    setError(errors.join("\n"));
  }
  else{
    setError("");
  }


  if(validFiles.length > 0){

    setFiles((prev)=>[
      ...prev,
      ...validFiles,
    ]);

  }


  e.target.value = "";

};


  const removeFile = (index) => {
    setFiles((prev) => {
      URL.revokeObjectURL(prev[index].preview);

      return prev.filter((_, i) => i !== index);
    });
  };


  const handleSend = async (e) => {
    e.preventDefault();

    if (!chat?._id) return;
    if (!draft.trim() && files.length === 0) return;

    const currentDraft = draft.trim();
    const currentFiles = [...files];

    setDraft("");
    setFiles([]);

    try {
      await onSendMessage(chat._id, currentDraft, currentFiles);
    } catch (error) {
      console.error("Message sending error:", error);
    }
  };



  return (
    <form
      onSubmit={handleSend}
      className="border-t p-4"
    >


      {/* File Preview */}
      {files.length > 0 && (

        <div className="mb-3 flex flex-wrap gap-3">

          {files.map((item, index) => (

            <div
              key={index}
              className="relative h-20 w-20 overflow-hidden rounded-lg border"
            >

              {
                item.file.type.startsWith("image") ? (

                  <img
                    src={item.preview}
                    alt="preview"
                    className="h-full w-full object-cover"
                  />

                ) : (

                  <div className="flex h-full items-center justify-center p-2 text-xs">
                    {item.file.name}
                  </div>

                )
              }



              {/* Upload Loader */}
              {uploadingFile && (

                <div
                  className="
                    absolute inset-0 
                    flex items-center justify-center
                    bg-black/50
                  "
                >
                  <Loader2
                    className="animate-spin text-white"
                    size={24}
                  />
                </div>

              )}




              {/* Remove Button */}
              {!uploadingFile && (

                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="
                    absolute right-1 top-1
                    rounded-full
                    bg-black/60
                    p-1
                    text-white
                  "
                >
                  <X size={12}/>
                </button>

              )}

            </div>

          ))}

        </div>

      )}
<div
        className="
          flex items-center gap-2
          rounded-full
          border
          bg-muted/50
          px-3 py-2
        "
      >


        <input
          ref={fileInputRef}
          type="file"
          multiple
          hidden
          accept="image/jpeg,image/png,image/gif,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,video/mp4"
          onChange={handleFileSelect}
        />
       


        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="
            rounded-full
            p-2
            text-muted-foreground
            hover:bg-muted
          "
        >
          <Paperclip size={18} />
        </button>

        <input
          value={draft}
          onChange={handleInput}
          placeholder="Type a message"
          className="
            flex-1
            bg-transparent
            outline-none
          "
        />

        <button
          type="submit"
          disabled={!draft.trim() && files.length === 0}
          className="
            rounded-full
            bg-primary
            p-2
            text-primary-foreground
            disabled:opacity-50
          "
        >
          <Send size={18} />
        </button>


      </div>

      {error && (
        <div className="mt-2 px-3 text-xs text-destructive whitespace-pre-line">
          {error}
        </div>
      )}

    </form>
  );
}


export default MessageInput;