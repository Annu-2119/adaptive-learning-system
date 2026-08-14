"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

type Attempt = {
  id: number;
  student_id: number;
  student_name: string;

  score: number;
  mastery_status: number;

  weak_topic?: string;
  recommended_level?: string;
  recommended_quiz?: string;
  recommended_quiz_id?: number | null;

  feedback?: string;
};

type Stats = {
  totalAttempts: number;
  averageScore: number;
  masteredCount: number;
  partiallyMasteredCount: number;
  notMasteredCount: number;
  weakCount: number;
  recommendations: number;
};

export default function InstructorDashboard() {
  const [user, setUser] = useState<any>(null);

  const [stats, setStats] = useState<Stats | null>(null);

  const [attempts, setAttempts] = useState<Attempt[]>([]);

  const [scoreData, setScoreData] = useState<any[]>([]);

  const [feedback, setFeedback] = useState<{
    [key: number]: string;
  }>({});

  const router = useRouter();

  useEffect(() => {
    const data = Cookies.get("user");

    if (data) {
      try {
        setUser(JSON.parse(data));
      } catch (error) {
        console.error(
          "Failed to parse user cookie:",
          error
        );
      }
    }
  }, []);

  const loadAnalytics = async () => {
    try {
      const res = await axios.get(
        "http://localhost:5000/api/analytics"
      );

      console.log(
        "Instructor Analytics:",
        res.data
      );

      setStats({
        totalAttempts: Number(
          res.data.totalAttempts || 0
        ),

        averageScore: Number(
          res.data.averageScore || 0
        ),

        masteredCount: Number(
          res.data.masteredCount || 0
        ),

        partiallyMasteredCount: Number(
          res.data.partiallyMasteredCount || 0
        ),

        notMasteredCount: Number(
          res.data.notMasteredCount || 0
        ),

        weakCount: Number(
          res.data.weakCount || 0
        ),

        recommendations: Number(
          res.data.recommendations || 0
        ),
      });
    } catch (err) {
      console.error(
        "Failed to load analytics:",
        err
      );
    }
  };

  const loadScoreData = async () => {
    try {
      const res = await axios.get(
        "http://localhost:5000/api/analytics/scores"
      );

      console.log(
        "Instructor Score Data:",
        res.data
      );

      setScoreData(
        Array.isArray(res.data)
          ? res.data
          : []
      );
    } catch (err) {
      console.error(
        "Failed to load score data:",
        err
      );
    }
  };

  const loadAttempts = async () => {
    try {
      const res = await axios.get(
        "http://localhost:5000/api/instructor/attempts"
      );

      console.log(
        "Instructor Attempts:",
        res.data
      );

      const data = Array.isArray(res.data)
        ? res.data
        : [];

      const normalizedAttempts = data.map(
        (attempt: Attempt) => ({
          ...attempt,
          id: Number(attempt.id),
          student_id: Number(
            attempt.student_id
          ),
        })
      );

      console.log(
        "Normalized Instructor Attempts:",
        normalizedAttempts
      );

      setAttempts(normalizedAttempts);
    } catch (err) {
      console.error(
        "Failed to load instructor attempts:",
        err
      );

      setAttempts([]);
    }
  };

  useEffect(() => {
    loadAnalytics();
    loadScoreData();
    loadAttempts();
  }, []);

  const totalStudents = new Set(
    attempts.map(
      (a) => a.student_id
    )
  ).size;

  const pieData = stats
    ? [
        {
          name: "Mastered",
          value: Number(
            stats.masteredCount || 0
          ),
        },
        {
          name: "Partially Mastered",
          value: Number(
            stats.partiallyMasteredCount || 0
          ),
        },
        {
          name: "Not Mastered",
          value: Number(
            stats.notMasteredCount || 0
        ),
      },
      ]
    : [];

  const COLORS = [
    "#22c55e",
    "#eab308",
    "#ef4444",
  ];

  const logout = () => {
    Cookies.remove("token");
    Cookies.remove("user");

    window.location.href = "/";
  };

  const refresh = async () => {
    await Promise.all([
      loadAnalytics(),
      loadScoreData(),
      loadAttempts(),
    ]);
  };

  const sendFeedback = async (
    attemptId: number
  ) => {
    const message = feedback[attemptId];

    if (
      !message ||
      message.trim() === ""
    ) {
      alert(
        "Feedback cannot be empty"
      );
      return;
    }

    try {
      await axios.post(
        "http://localhost:5000/api/feedback",
        {
          attemptId,
          message: message.trim(),
        }
      );

      alert(
        "Feedback sent successfully!"
      );

      setFeedback((prev) => ({
        ...prev,
        [attemptId]: "",
      }));

      await loadAttempts();
    } catch (err) {
      console.error(
        "Feedback error:",
        err
      );

      alert(
        "Failed to send feedback"
      );
    }
  };

  const manageCard =
    "bg-white rounded-2xl shadow-md border p-6 hover:-translate-y-1 hover:shadow-xl transition";

  const primaryButton =
    "bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl transition";

  const successButton =
    "bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl transition";

  const textareaStyle =
    "w-full border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none";

  return (
    <div className="min-h-screen bg-slate-300 p-8">
      <div className="max-w-7xl mx-auto">

        <div
          className="
            bg-gradient-to-r
            from-blue-600
            via-indigo-600
            to-purple-600
            rounded-3xl
            shadow-xl
            p-8
            mb-8
            text-white
          "
        >
          <div
            className="
              flex
              flex-col
              lg:flex-row
              lg:justify-between
              lg:items-center
              gap-6
            "
          >
            <div>
              <h1 className="text-3xl font-bold mt-2">
                Welcome, {user?.name}
              </h1>

              <p className="mt-3 text-blue-100 text-lg">
                Manage courses, quizzes, student
                performance and learning analytics
                from one dashboard.
              </p>
            </div>

            <div className="flex gap-3 flex-wrap">

              <button
                onClick={refresh}
                className="
                  bg-white/20
                  hover:bg-white/30
                  px-5
                  py-3
                  rounded-xl
                  transition
                  backdrop-blur-sm
                "
              >
                🔄 Refresh
              </button>

              <a
                href="http://localhost:5000/api/export/attempts"
                target="_blank"
                rel="noopener noreferrer"
                className="
                  bg-green-500
                  hover:bg-green-600
                  px-5
                  py-3
                  rounded-xl
                  transition
                "
              >
                📥 Download CSV
              </a>

              <button
                onClick={logout}
                className="
                  flex
                  items-center
                  gap-2
                  bg-red-500
                  hover:bg-red-600
                  transition
                  text-white
                  px-4
                  py-2
                  rounded-xl
                "
              >
                <LogOut size={18} />
                Logout
              </button>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">

          <button
            onClick={() =>
              router.push(
                "/instructor/courses"
              )
            }
            className={manageCard}
          >
            <div className="text-4xl">
              📚
            </div>

            <h3 className="font-bold text-slate-800 mt-4">
              Manage Courses
            </h3>

            <p className="text-slate-500 text-sm mt-2">
              Create, edit and organize
              your courses.
            </p>
          </button>

          <button
            onClick={() =>
              router.push(
                "/instructor/quizzes"
              )
            }
            className={manageCard}
          >
            <div className="text-4xl">
              📝
            </div>

            <h3 className="font-bold text-slate-800 mt-4">
              Manage Quizzes
            </h3>

            <p className="text-slate-500 text-sm mt-2">
              Add quiz sets and organize
              assessments.
            </p>
          </button>

          <button
            onClick={() =>
              router.push(
                "/instructor/questions"
              )
            }
            className={manageCard}
          >
            <div className="text-4xl">
              ❓
            </div>

            <h3 className="font-bold text-slate-800 mt-4">
              Manage Questions
            </h3>

            <p className="text-slate-500 text-sm mt-2">
              Create and edit quiz
              questions.
            </p>
          </button>

          <button
            onClick={() =>
              router.push(
                "/instructor/materials"
              )
            }
            className={manageCard}
          >
            <div className="text-4xl">
              📂
            </div>

            <h3 className="font-bold text-slate-800 mt-4">
              Course Materials
            </h3>

            <p className="text-slate-500 text-sm mt-2">
              Upload and manage
              learning resources.
            </p>
          </button>
        </div>

        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">

          <div className="bg-indigo-600 rounded-2xl shadow-md border p-6">
            <p className="text-white text-sm">
              Total Students
            </p>

            <h2 className="text-4xl font-bold text-white mt-2">
              {totalStudents}
            </h2>
          </div>

          <div className="bg-indigo-600 rounded-2xl shadow-md border p-6">
            <p className="text-white text-sm">
              Total Attempts
            </p>

            <h2 className="text-4xl font-bold text-white mt-2">
              {stats?.totalAttempts ?? 0}
            </h2>
          </div>

          <div className="bg-indigo-600 rounded-2xl shadow-md border p-6">
            <p className="text-white text-sm">
              Average Score
            </p>

            <h2 className="text-4xl font-bold text-white mt-2">
              {Number(
                stats?.averageScore || 0
              ).toFixed(2)}
              %
            </h2>
          </div>

          <div className="bg-indigo-600 rounded-2xl shadow-md border p-6">
            <p className="text-white text-sm">
              Recommendations
            </p>

            <h2 className="text-4xl font-bold text-white mt-2">
              {stats?.recommendations ?? 0}
            </h2>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 mb-8">

          <div
            className="
              bg-white
              rounded-3xl
              shadow-md
              border
              p-6
            "
          >
            <h2 className="text-xl font-bold text-slate-800 mb-6">
              Student Scores
            </h2>

            <ResponsiveContainer
              width="100%"
              height={320}
            >
              <BarChart data={scoreData}>
                <XAxis
                  dataKey="student"
                  tick={{
                    fill: "#475569",
                  }}
                  axisLine={{
                    stroke: "#CBD5E1",
                  }}
                  tickLine={{
                    stroke: "#CBD5E1",
                  }}
                />

                <YAxis
                  tick={{
                    fill: "#475569",
                  }}
                  axisLine={{
                    stroke: "#CBD5E1",
                  }}
                  tickLine={{
                    stroke: "#CBD5E1",
                  }}
                />

                <Tooltip />

                <Bar
                  dataKey="score"
                  radius={[
                    8,
                    8,
                    0,
                    0,
                  ]}
                  fill="#410072"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div
            className="
              bg-white
              rounded-3xl
              shadow-md
              border
              p-6
            "
          >
            <h2 className="text-xl font-bold text-slate-800 mb-6">
              Mastery Distribution
            </h2>

            <ResponsiveContainer
              width="100%"
              height={320}
            >
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={95}
                  paddingAngle={4}
                  label={(props: any) =>
                    `${props.name} ${(
                      (props.percent ?? 0) *
                      100
                    ).toFixed(0)}%`
                  }
                >
                  {pieData.map(
                    (entry, index) => (
                      <Cell
                        key={index}
                        fill={
                          COLORS[index]
                        }
                      />
                    )
                  )}
                </Pie>

                <Tooltip />

                <Legend
                  verticalAlign="bottom"
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div
          className="
            bg-indigo-700
            rounded-3xl
            shadow-md
            border
            p-6
          "
        >
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white">
                Student Performance & Feedback
              </h2>

              <p className="text-white mt-1">
                Review quiz attempts and provide
                feedback.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-purple-500">
                <tr>
                  <th className="text-left p-4 text-white">
                    Student
                  </th>

                  <th className="text-left p-4 text-white">
                    Score
                  </th>

                  <th className="text-left p-4 text-white">
                    Mastery
                  </th>

                  <th className="text-left p-4 text-white">
                    Weak Topic
                  </th>

                  <th className="text-left p-4 text-white">
                    Answers
                  </th>

                  <th className="text-left p-4 text-white">
                    Feedback
                  </th>

                  <th className="text-left p-4 text-white">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {attempts.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="
                        text-center
                        p-8
                        text-white
                      "
                    >
                      No quiz attempts found.
                    </td>
                  </tr>
                ) : (
                  attempts.map((a) => (
                    <tr
                      key={a.id}
                      className="
                        border-b
                        hover:bg-purple-600
                        transition
                      "
                    >

                      <td className="p-4 font-semibold text-white">
                        {a.student_name}
                      </td>

                      <td className="p-4 font-semibold text-white">
                        {Number(
                          a.score || 0
                        ).toFixed(2)}
                        %
                      </td>

                      <td className="p-4">
                        {Number(a.score || 0) > 75 ? (
                      <span
                        className="
                       bg-green-100
                       text-green-700
                       px-3
                       py-1
                       rounded-full
                       text-sm
                       font-semibold
                       "
                      >
                        Mastered
                      </span>
                       ) : Number(a.score || 0) >= 50 ? (
                      <span
                        className="
                       bg-yellow-100
                       text-yellow-700
                       px-3
                       py-1
                       rounded-full
                       text-sm
                       font-semibold
                       "
                      >
                        Partially Mastered
                      </span>
                       ) : (
                      <span
                        className="
                       bg-red-100
                       text-red-700
                        px-3
                        py-1
                        rounded-full
                        text-sm
                        font-semibold
                        "
                      >
                        Not Mastered
                      </span>
                      )}
                      </td>

                      <td className="p-4 text-white">
                        {a.weak_topic || "-"}
                      </td>

                      <td className="p-4">
                        <button
                          onClick={() => {
                            console.log(
                              "Opening attempt:",
                              a.id
                            );

                            const attemptId =
                              Number(a.id);

                            console.log(
                              "Attempt ID being sent:",
                              attemptId
                            );

                            router.push(
                              `/instructor/grade/${attemptId}`
                            );
                          }}
                          className="
                            bg-green-600
                            hover:bg-green-700
                            text-white
                            px-4
                            py-2
                            rounded-xl
                            transition
                          "
                        >
                          View Answers
                        </button>
                      </td>

                      <td className="p-4">
                        <textarea
                          className={
                            textareaStyle
                          }
                          rows={3}
                          placeholder={
                            a.feedback ||
                            "Write feedback..."
                          }
                          value={
                            feedback[a.id] ??
                            a.feedback ??
                            ""
                          }
                          onChange={(e) =>
                            setFeedback(
                              (prev) => ({
                                ...prev,
                                [a.id]:
                                  e.target
                                    .value,
                              })
                            )
                          }
                        />
                      </td>

                      <td className="p-4">
                        <button
                          onClick={() =>
                            sendFeedback(a.id)
                          }
                          className={
                            primaryButton
                          }
                        >
                          Send
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}