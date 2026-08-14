"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import axios from "axios";
import { motion } from "framer-motion";

import {
  BookOpen,
  GraduationCap,
  Trophy,
  Brain,
  Download,
  PlayCircle,
  LogOut,
  User,
} from "lucide-react";

export default function StudentDashboard() {
  const [user, setUser] = useState<any>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [dashboard, setDashboard] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [loadingDashboard, setLoadingDashboard] = useState(true);

  const router = useRouter();

  useEffect(() => {
    const data = Cookies.get("user");

    if (data) {
      const currentUser = JSON.parse(data);
      setUser(currentUser);

      axios
        .get(`http://localhost:5000/api/student-dashboard/${currentUser.id}`)
        .then((res) => {
          setDashboard(res.data.dashboard);
          setLoadingDashboard(false);
        })
        .catch((err) => {
          console.error(err);
          setLoadingDashboard(false);
        });
    } else {
      setLoadingDashboard(false);
    }

    axios
      .get("http://localhost:5000/api/courses")
      .then((res) => {
        setCourses(res.data);
        return axios.get("http://localhost:5000/api/materials");
      })
      .then((materialRes) => {
        setMaterials(materialRes.data);
      })
      .catch((err) => {
        console.error("Error loading data:", err);
      });
  }, []);

  const logout = () => {
    Cookies.remove("token");
    Cookies.remove("user");
    window.location.href = "/";
  };

  return (
  <div className="min-h-screen bg-slate-400">

    <nav className="bg-white shadow-md border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-8 h-16 flex items-center justify-between">

        <div>

          <h1 className="text-2xl font-bold text-slate-800">
            Student Dashboard
          </h1>
        </div>

        <button
          onClick={logout}
          className="flex items-center gap-2 bg-red-500 hover:bg-red-600 transition text-white px-5 py-2 rounded-xl font-medium"
        >
          <LogOut size={18} />
          Logout
        </button>

      </div>
    </nav>

    <div className="max-w-7xl mx-auto p-8">

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="
          bg-gradient-to-r
          from-blue-600
          via-indigo-600
          to-purple-600
          rounded-3xl
          shadow-xl
          p-8
          text-white
        "
      >

        <h1 className="text-3xl font-bold mt-2">
          Welcome, {user?.name} 
        </h1>

        <p className="mt-3 text-blue-100 text-lg max-w-5xl">
          Continue your learning journey through adaptive quizzes,
          personalized recommendations, and interactive learning
          materials.
        </p>
      </motion.div>

      <div className="grid md:grid-cols-3 gap-6 mt-8">

        <div className="bg-white border border-slate-200 rounded-2xl shadow-md p-6 hover:shadow-xl transition">

          <h3 className="text-slate-800 font-medium">
            Courses Available
          </h3>

          <p className="text-4xl font-bold text-blue-600 mt-2">
            {courses.length}
          </p>

        </div>

        <div className="bg-white border border-slate-200 rounded-2xl shadow-md p-6 hover:shadow-xl transition">

          <h3 className="text-slate-800 font-medium">
            Recommendations
          </h3>

          <p className="text-4xl font-bold text-blue-600 mt-2">
            {dashboard.filter((d: any) => d.recommended_quiz).length}
          </p>

        </div>

        <div className="bg-white border border-slate-200 rounded-2xl shadow-md p-6 hover:shadow-xl transition">

          <h3 className="text-slate-800 font-medium">
            Mastered Courses
          </h3>

          <p className="text-4xl font-bold text-blue-600 mt-2">
            {dashboard.filter((d: any) => d.mastery_status).length}
          </p>

        </div>

      </div>

      <h2 className="text-3xl font-bold text-slate-800 mt-10 mb-6">
        Your Learning Progress
      </h2>

      {loadingDashboard ? (

        <div className="bg-white border border-slate-200 rounded-2xl shadow-md p-6">
          <p className="text-slate-600">
            Loading your learning progress...
          </p>
        </div>

      ) : dashboard.length === 0 ? (

        <div className="bg-white border border-slate-200 rounded-2xl shadow-md p-6">
          <p className="text-slate-600">
            No learning progress yet.
          </p>
        </div>

      ) : (

        <div className="space-y-6">

          {dashboard.map((item: any) => (

            <div
              key={item.course_id}
              className="
                bg-purple-600
                rounded-3xl
                border
                border-slate-200
                shadow-md
                p-6
                hover:shadow-xl
                transition
              "
            >

              <h3 className="text-2xl font-bold text-white">
                {item.course}
              </h3>


              <div className="w-full bg-slate-200 rounded-full h-4 mt-5 overflow-hidden">

                <div
                  className="bg-green-500 h-4 rounded-full transition-all duration-700"
                  style={{
                    width: `${Math.min(item.score ?? 0, 100)}%`,
                  }}
                />

              </div>

              <p className="mt-2 text-white">
                <strong>Latest Quiz Score:</strong> {item.score}%
              </p>

              <div className="mt-4 flex items-center gap-3 flex-wrap">

                <strong className="text-white">
                  Mastery Status:
                </strong>

                <span
                  className={`px-3 py-1 rounded-full font-semibold text-sm ${
                    item.mastery_badge === "green"
                      ? "bg-green-100 text-green-700"
                      : item.mastery_badge === "blue"
                      ? "bg-blue-100 text-blue-700"
                      : item.mastery_badge === "yellow"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {item.mastery_label}
                </span>

              </div>

              <p className="mt-4 text-white">
                <strong>Weak Topic:</strong>{" "}
                {item.weak_topic || "None"}
              </p>


              {item.feedback && (

                <div className="mt-5 bg-purple-600 border border-slate-200 rounded-xl p-4">

                  <p className="font-semibold text-white mb-2">
                    Instructor Feedback
                  </p>

                  <p className="text-white">
                    {item.feedback}
                  </p>

                </div>

              )}

              <div className="mt-5 bg-purple-600 border border-slate-200 rounded-xl p-4">

                <p className="font-semibold text-white">
                  Recommended Quiz
                </p>

                <p className="mt-2 text-white">
                  {item.recommended_quiz ||
                    "No recommendation available"}
                </p>

                <p className="mt-2 text-white">
                  <strong>Recommended Difficulty:</strong>{" "}
                  {item.recommended_level || "Not Available"}
                </p>

              </div>

              <button
                onClick={() => {
                  if (!item.recommended_quiz_id) {
                    alert("No recommended quiz available");
                    return;
                  }

                  router.push(
                    `/quiz/${item.course_id}?startSet=${item.recommended_quiz_id}`
                  );
                }}
                className="
                  mt-5
                  bg-blue-600
                  hover:bg-blue-700
                  text-white
                  px-5
                  py-3
                  rounded-xl
                  transition
                  font-semibold
                "
              >
                Continue Learning
              </button>

            </div>

          ))}

        </div>

      )}

      <h2 className="text-3xl font-bold text-slate-800 mt-10 mb-6">
        Available Courses
      </h2>

      <div className="grid md:grid-cols-2 gap-6">

        {courses.length === 0 ? (

          <div className="bg-white border border-slate-200 rounded-3xl shadow-md p-8">

            <p className="text-slate-800">
              Loading courses...
            </p>

          </div>

        ) : (

          courses.map((c: any) => (

            <motion.div
              key={c.id}
              whileHover={{ y: -5 }}
              transition={{ duration: 0.2 }}
              className="
                bg-white
                border
                border-slate-200
                rounded-3xl
                shadow-md
                hover:shadow-xl
                transition
                p-6
              "
            >

              <div className="flex items-center gap-3">

                <div className="bg-blue-100 p-3 rounded-xl">
                  <BookOpen className="text-blue-600" size={24} />
                </div>

                <div>

                  <h3 className="text-2xl font-bold text-slate-800">
                    {c.title}
                  </h3>

                </div>

              </div>

              <p className="text-slate-800 mt-5 leading-relaxed">
                {c.description}
              </p>

              <div className="mt-6">

                <h4 className="font-semibold text-slate-800 mb-3">
                  Course Materials
                </h4>

                {materials.filter((m: any) => m.course_id === c.id).length === 0 ? (

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">

                    <p className="text-slate-800">
                      No materials uploaded.
                    </p>

                  </div>

                ) : (

                  <div className="space-y-3">

                    {materials
                      .filter((m: any) => m.course_id === c.id)
                      .map((m: any) => (

                        <div
                          key={m.id}
                          className="
                            flex
                            items-center
                            justify-between
                            bg-slate-50
                            border
                            border-slate-200
                            rounded-xl
                            p-3
                          "
                        >

                          <div className="flex items-center gap-3">

                            <div className="bg-indigo-100 p-2 rounded-lg">

                              <BookOpen
                                size={18}
                                className="text-indigo-600"
                              />

                            </div>

                            <span className="text-slate-700 font-medium">
                              {m.title}
                            </span>

                          </div>

                          <a
                            href={`http://localhost:5000/uploads/materials/${m.file_path}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="
                              flex
                              items-center
                              gap-2
                              bg-indigo-600
                              hover:bg-indigo-700
                              text-white
                              px-4
                              py-2
                              rounded-lg
                              transition
                            "
                          >

                            <Download size={16} />
                            Download

                          </a>

                        </div>

                      ))}

                  </div>

                )}

              </div>

              <button
                onClick={() => router.push(`/quiz/${c.id}`)}
                className="
                  mt-6
                  w-full
                  flex
                  items-center
                  justify-center
                  gap-2
                  bg-blue-600
                  hover:bg-blue-700
                  text-white
                  py-3
                  rounded-xl
                  font-semibold
                  transition
                "
              >

                <PlayCircle size={20} />

                Start Quiz

              </button>

            </motion.div>

          ))

        )}

      </div>

    </div>

  </div>
);
}
