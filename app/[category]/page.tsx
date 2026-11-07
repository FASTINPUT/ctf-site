"use client";
import { useParams } from "next/navigation";
import Archive from "../components/Archive";
export default function CategoryPage() {
  const { category } = useParams<{ category: string }>();
  return <Archive key={category} category={category} />;
}
