"use client";

import { Note as NoteModel } from "@prisma/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { useState } from "react";
import AddEditNoteDialog from "./AddEditNoteDialog";

interface NoteProps {
  note: NoteModel;
}

export default function Note({ note }: NoteProps) {
  const [showEditDialog, setShowAddEditNoteDialog] = useState(false);
  const wasUpdated = note.updatedAt > note.createdAt;
  const createdUpdatedAtTimestamp = (
    wasUpdated ? note.updatedAt : note.createdAt
  ).toDateString();

  return (
    <>
      <Card
        className="cursor-pointer hover:shadow-lg transition-shadow"
        onClick={() => setShowAddEditNoteDialog(true)}
      >
        <CardHeader>
          <CardTitle>{note.title}</CardTitle>
          <CardDescription>{createdUpdatedAtTimestamp}</CardDescription>
          {wasUpdated && " (updated)"}
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-line">{note.content}</p>
        </CardContent>
      </Card>
      <AddEditNoteDialog
        open={showEditDialog}
        setOpen={setShowAddEditNoteDialog}
        noteToEdit={note}
      />
    </>
  );
}
