"use client";

import { useEffect, useState } from "react";
import axios from "axios";

export default function CourseManagementPage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
  });

  const loadCourses = () => {
    axios
      .get("http://localhost:5000/api/courses")
      .then((res) => setCourses(res.data))
      .catch(console.error);
  };

  useEffect(() => {
    loadCourses();
  }, []);

  const saveCourse = async () => {
    try {
      if (editingId) {
        await axios.put(
          `http://localhost:5000/api/courses/${editingId}`,
          form
        );
      } else {
        await axios.post(
          "http://localhost:5000/api/courses",
          form
        );
      }

      setShowModal(false);
      setEditingId(null);

      setForm({
        title: "",
        description: "",
      });

      loadCourses();
    } catch (err) {
      console.error(err);
    }
  };

  const deleteCourse = async (id: number) => {
    if (!confirm("Delete this course?")) return;

    try {
      await axios.delete(
        `http://localhost:5000/api/courses/${id}`
      );

      loadCourses();
    } catch (err) {
      console.error(err);
    }
  };

  const editCourse = (course: any) => {
    setEditingId(course.id);

    setForm({
      title: course.title,
      description: course.description,
    });

    setShowModal(true);
  };

  return (
    <div className="min-h-screen bg-slate-900 p-8">

      <div className="bg-gradient-to-r from-indigo-700 via-blue-700 to-purple-700 rounded-3xl shadow-xl p-8 mb-8">

        <h1 className="text-4xl font-bold text-white">
          Course Management
        </h1>

        <p className="text-blue-100 mt-2">
          Create, update and manage your available courses.
        </p>

      </div>

      <div className="mb-6">

        <button
          onClick={() => {
            setEditingId(null);

            setForm({
              title: "",
              description: "",
            });

            setShowModal(true);
          }}
          className="bg-emerald-600 hover:bg-emerald-700 transition text-white px-6 py-3 rounded-xl font-semibold shadow"
        >
          + Add Course
        </button>

      </div>

      <div className="bg-slate-800 rounded-2xl shadow-xl border border-slate-700 overflow-hidden">

        <table className="w-full">

          <thead className="bg-indigo-700 text-white">

            <tr>

              <th className="text-left p-4">
                Course Title
              </th>

              <th className="text-left">
                Description
              </th>

              <th className="text-center">
                Actions
              </th>

            </tr>

          </thead>

          <tbody>

            {courses.length === 0 ? (

              <tr>

                <td
                  colSpan={3}
                  className="text-center text-slate-400 p-8"
                >
                  No courses available.
                </td>

              </tr>

            ) : (

              courses.map((course) => (

                <tr
                  key={course.id}
                  className="border-b border-slate-700 hover:bg-slate-700 transition text-white"
                >

                  <td className="p-4 font-semibold">
                    {course.title}
                  </td>

                  <td className="text-slate-300">
                    {course.description}
                  </td>

                  <td className="text-center space-x-3">

                    <button
                      onClick={() => editCourse(course)}
                      className="bg-amber-500 hover:bg-amber-600 transition text-white px-4 py-2 rounded-xl"
                    >
                      Edit
                    </button>

                    <button
                      onClick={() => deleteCourse(course.id)}
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

      {showModal && (

        <div className="fixed inset-0 bg-black/60 flex justify-center items-center">

          <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl w-[450px] p-6">

            <h2 className="text-2xl font-bold text-white mb-6">

              {editingId ? "Edit Course" : "Add Course"}

            </h2>

            <input
              className="w-full bg-slate-700 border border-slate-600 rounded-xl p-3 text-white mb-4 outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Course Title"
              value={form.title}
              onChange={(e) =>
                setForm({
                  ...form,
                  title: e.target.value,
                })
              }
            />

            <textarea
              rows={5}
              className="w-full bg-slate-700 border border-slate-600 rounded-xl p-3 text-white mb-6 outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Course Description"
              value={form.description}
              onChange={(e) =>
                setForm({
                  ...form,
                  description: e.target.value,
                })
              }
            />

            <div className="flex justify-end gap-3">

              <button
                onClick={() => setShowModal(false)}
                className="bg-slate-600 hover:bg-slate-700 transition text-white px-5 py-2 rounded-xl"
              >
                Cancel
              </button>

              <button
                onClick={saveCourse}
                className="bg-blue-600 hover:bg-blue-700 transition text-white px-5 py-2 rounded-xl"
              >
                {editingId ? "Update" : "Save"}
              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}