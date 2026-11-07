"use client";
import { useParams } from "next/navigation";
import Editor from "../../components/Editor";
export default function Edit() {
  const { id } = useParams<{ id: string }>();
  return <Editor key={id} id={id} />;
}
