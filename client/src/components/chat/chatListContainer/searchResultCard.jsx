import React from "react";
import { UserPlus } from "lucide-react";

function SearchResultCard({
  person,
  message,
  setMessage,
  onInvite,
}) {

  const id =
    person._id?.toString() ||
    person.id?.toString();


  const status = person.connectionStatus;


  const disabled =
    status === "connected" ||
    status === "pending_sent" ||
    status === "pending_received" ||
    status === "cooldown";


  let label="Invite";

  if(status==="connected")
    label="Connected";

  else if(status==="pending_sent")
    label="Pending";

  else if(status==="pending_received")
    label="Check invites";

  else if(status==="cooldown")
    label="Cooldown";


  return (
    <div className="rounded-lg border border-border p-2">
       <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
         <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 font-semibold text-primary">
          {person.name?.charAt(0)?.toUpperCase() || "U"}
            {person.isOnline && (
              <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-card bg-green-500"/>
            )}
            </div>
             <div>
<p className="text-sm font-medium">
              {person.name}
            </p>
<p className="text-xs text-muted-foreground">
              {person.email}
            </p>
</div>
</div>


        <button
          onClick={()=>onInvite(id)}
          disabled={disabled}
          className="flex items-center gap-1 rounded-full bg-primary px-2 py-1 text-xs text-white disabled:opacity-50"
        >
            {!disabled && <UserPlus className="h-3.5 w-3.5"/>}

          {label}
</button>
</div>
{!disabled && (
        <input
          value={message}
          onChange={(e)=>setMessage(e.target.value)}
          placeholder="Optional message"
          className="mt-2 w-full rounded-md border px-2 py-1 text-xs"
        />
      )}

    </div>
  );
}


export default React.memo(SearchResultCard);