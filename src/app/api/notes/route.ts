import { notesIndex } from "@/lib/db/pinecone";
import { getEmbeding } from "@/lib/openai";
import {
  createNoteSchema,
  deleteNoteSchema,
  updateNoteScehma,
} from "@/lib/validation/note";
import { auth } from "@clerk/nextjs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parseResult = createNoteSchema.safeParse(body);

    if (!parseResult.success) {
      console.error(parseResult.error);
      return Response.json({ error: "Invalid input" }, { status: 400 });
    }

    const { title, content } = parseResult.data;
    const { userId } = auth();

    if (!userId) {
      return Response.json({ error: "Unautorhized" }, { status: 404 });
    }

    const embedding = await getEmbedingForNote(title, content);

    const note = await prisma?.$transaction(async (tx) => {
      const note = await tx.note.create({
        data: {
          title,
          content,
          userId,
        },
      });

      await notesIndex.upsert([
        {
          id: note.id,
          values: embedding,
          metadata: { userId },
        },
      ]);

      return note;
    });

    return Response.json({ note }, { status: 201 });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

/// So we receive the request here
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const parseResult = updateNoteScehma.safeParse(body);

    if (!parseResult.success) {
      console.error(parseResult.error);
      return Response.json({ error: "Invalid input" }, { status: 400 });
    }

    const { id, title, content } = parseResult.data;

    const note = await prisma?.note.findUnique({ where: { id } });

    if (!note) {
      return Response.json({ error: "Note not found" }, { status: 404 });
    }

    const { userId } = auth();

    // User here don't have authorization to handle all of that.
    if (!userId || userId !== note.userId) {
      return Response.json({ error: "Unautorhized" }, { status: 401 });
    }

    const embedding = await getEmbedingForNote(title, content);
    const updatedNote = await prisma?.$transaction(async (tx) => {
      const updatedNote = await tx.note.update({
        where: { id },
        data: {
          title,
          content,
        },
      });

      await notesIndex.upsert([
        {
          id,
          values: embedding,
          metadata: { userId },
        },
      ]);
      return updatedNote;
    });

    // 200 is enough as we are not creating new note.
    return Response.json({ updatedNote }, { status: 200 });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const body = await req.json();
    const parseResult = deleteNoteSchema.safeParse(body);

    if (!parseResult.success) {
      console.error(parseResult.error);
      return Response.json({ error: "Invalid input" }, { status: 400 });
    }

    const { id } = parseResult.data;

    const note = await prisma?.note.findUnique({ where: { id } });

    if (!note) {
      return Response.json({ error: "Note not found" }, { status: 404 });
    }

    const { userId } = auth();

    // User here don't have authorization to handle all of that.
    if (!userId || userId !== note.userId) {
      return Response.json({ error: "Unautorhized" }, { status: 401 });
    }

    await prisma?.$transaction(async (tx) => {
      await tx.note.delete({ where: { id } });
      await notesIndex.deleteOne(id);
    });
    // 200 is enough as we are not creating new note.
    return Response.json({ message: "Note deleted" }, { status: 200 });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

async function getEmbedingForNote(title: string, content: string | undefined) {
  return getEmbeding(title + "\n\n" + content ?? "");
}
