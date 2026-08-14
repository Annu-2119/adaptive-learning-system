"use client";

import { useEffect, useState } from "react";
import axios from "axios";

export default function MaterialsPage() {
  const [materials, setMaterials] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [title, setTitle] = useState("");
  const [courseId, setCourseId] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const loadMaterials = () => {
    axios
      .get("https://adaptive-learning-system-5a2d.onrender.com/api/materials")
      .then((res) => setMaterials(res.data))
      .catch(console.error);
  };

  const loadCourses = () => {
    axios
      .get("https://adaptive-learning-system-5a2d.onrender.com/api/courses")
      .then((res) => setCourses(res.data))
      .catch(console.error);
  };

  useEffect(() => {
    loadMaterials();
    loadCourses();
  }, []);

  const uploadMaterial = async () => {
    if (!title || !courseId || !file) {
      alert("Please complete all fields.");
      return;
    }

    const formData = new FormData();

    formData.append("title", title);
    formData.append("course_id", courseId);
    formData.append("file", file);

    try {
      await axios.post(
        "https://adaptive-learning-system-5a2d.onrender.com/api/materials",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      alert("Material uploaded successfully!");

      setTitle("");
      setCourseId("");
      setFile(null);

      loadMaterials();
    } catch (err) {
      console.error(err);
      alert("Upload failed.");
    }
  };

  const deleteMaterial = async (id: number) => {
    if (!confirm("Delete this material?")) return;

    try {
      await axios.delete(
        `https://adaptive-learning-system-5a2d.onrender.com/api/materials/${id}`
      );

      alert("Material deleted.");

      loadMaterials();
    } catch (err) {
      console.error(err);
      alert("Delete failed.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 p-8">

      {/* Header */}

      <div className="bg-gradient-to-r from-indigo-700 via-blue-700 to-purple-700 rounded-3xl shadow-xl p-8 mb-8">

        <h1 className="text-4xl font-bold text-white">
          Course Materials
        </h1>

        <p className="text-blue-100 mt-2">
          Upload learning resources and manage materials for students.
        </p>

      </div>

      <div className="bg-slate-800 rounded-2xl shadow-xl border border-slate-700 p-6 mb-8">

        <h2 className="text-2xl font-bold text-white mb-6">
          Upload Material
        </h2>

        <input
          className="w-full bg-slate-700 border border-slate-600 rounded-xl p-3 text-white mb-4 outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Material Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <select
          className="w-full bg-slate-700 border border-slate-600 rounded-xl p-3 text-white mb-4 outline-none focus:ring-2 focus:ring-blue-500"
          value={courseId}
          onChange={(e) => setCourseId(e.target.value)}
        >
          <option value="">Select Course</option>

          {courses.map((c: any) => (
            <option key={c.id} value={c.id}>
              {c.title}
            </option>
          ))}
        </select>

        <input
          type="file"
          className="block w-full text-slate-300 mb-6
          file:bg-indigo-600
          file:text-white
          file:border-0
          file:px-4
          file:py-2
          file:rounded-lg
          file:mr-4
          hover:file:bg-indigo-700"
          onChange={(e) =>
            setFile(
              e.target.files ? e.target.files[0] : null
            )
          }
        />

        <button
          onClick={uploadMaterial}
          className="bg-emerald-600 hover:bg-emerald-700 transition text-white px-6 py-3 rounded-xl font-semibold"
        >
          Upload Material
        </button>

      </div>

      <div className="bg-slate-800 rounded-2xl shadow-xl border border-slate-700 overflow-hidden">

        <div className="p-6 border-b border-slate-700">

          <h2 className="text-2xl font-bold text-white">
            Uploaded Materials
          </h2>

        </div>

        <table className="w-full">

          <thead className="bg-indigo-700 text-white">

            <tr>

              <th className="p-4 text-left">Course</th>

              <th className="text-left">Title</th>

              <th className="text-left">File Name</th>

              <th className="text-center">Action</th>

            </tr>

          </thead>

          <tbody>

            {materials.length === 0 ? (

              <tr>

                <td
                  colSpan={4}
                  className="text-center text-slate-400 p-8"
                >
                  No materials uploaded yet.
                </td>

              </tr>

            ) : (

              materials.map((m) => (

                <tr
                  key={m.id}
                  className="border-b border-slate-700 hover:bg-slate-700 transition text-white"
                >

                  <td className="p-4">
                    {m.course}
                  </td>

                  <td>
                    {m.title}
                  </td>

                  <td className="text-slate-300">
                    {m.file_name}
                  </td>

                  <td className="text-center">

                    <button
                      onClick={() => deleteMaterial(m.id)}
                      className="bg-red-600 hover:bg-red-700 transition text-white px-4 py-2 rounded-xl"
                    >
                      Delete
                    </button>

                  </td>

                </tr>

              ))

            )}

          </tbody>

        </table>

      </div>

    </div>
  );
}