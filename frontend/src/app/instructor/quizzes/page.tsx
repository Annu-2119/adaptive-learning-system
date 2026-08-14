"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Cookies from "js-cookie";

const API = "https://adaptive-learning-system-5a2d.onrender.com/api";

const inputStyle =
  "w-full border border-slate-300 rounded-xl px-4 py-2 mb-3 text-black focus:ring-2 focus:ring-blue-500 outline-none";

const btn =
  "px-4 py-2 rounded-xl text-white transition";

type Student = {
  id: number;
  name: string;
  email: string;
};

export default function QuizSetPage() {

  const [quizSets, setQuizSets] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);

  const [modal, setModal] = useState(false);

  const [publishModal, setPublishModal] =
    useState(false);

  const [editId, setEditId] =
    useState<number | null>(null);

  const [selectedQuiz, setSelectedQuiz] =
    useState<any>(null);

  const [students, setStudents] =
    useState<Student[]>([]);

  const [assignmentType, setAssignmentType] =
    useState<"all" | "selected">("all");

  const [selectedStudents, setSelectedStudents] =
    useState<number[]>([]);

  const [publishing, setPublishing] =
    useState(false);


  const empty = {
    title: "",
    topic: "",
    difficulty: "easy",
    course_id: ""
  };


  const [form, setForm] =
    useState(empty);


  // =====================================================
  // GET LOGGED-IN INSTRUCTOR ID
  // =====================================================

  const getInstructorId = () => {

    // ---------------------------------------------------
    // OPTION 1:
    // Login stores instructor ID directly in a cookie
    // ---------------------------------------------------

    const userId =
      Cookies.get("userId") ||
      Cookies.get("user_id") ||
      Cookies.get("id");

    if (userId) {

      const id = Number(userId);

      if (!isNaN(id) && id > 0) {
        return id;
      }

    }


    // ---------------------------------------------------
    // OPTION 2:
    // Login stores the complete user object
    // ---------------------------------------------------
    // Example:
    // Cookies.set("user", JSON.stringify(user));

    const userCookie =
      Cookies.get("user");

    if (userCookie) {

      try {

        const user =
          JSON.parse(userCookie);

        const id =
          Number(user?.id);

        if (!isNaN(id) && id > 0) {
          return id;
        }

      } catch (error) {

        console.error(
          "Failed to parse user cookie:",
          error
        );

      }

    }


    // ---------------------------------------------------
    // No instructor ID found
    // ---------------------------------------------------

    return null;
  };


  // =====================================================
  // LOAD DATA
  // =====================================================

  useEffect(() => {

    loadQuizSets();
    loadCourses();
    loadStudents();

  }, []);


  // =====================================================
  // LOAD QUIZ SETS
  // =====================================================

  const loadQuizSets = async () => {

    try {

      const res =
        await axios.get(`${API}/quizzes`);


      const order: any = {
        easy: 1,
        medium: 2,
        hard: 3
      };


      setQuizSets(
        res.data.sort(
          (a: any, b: any) =>
            order[a.difficulty] -
            order[b.difficulty]
        )
      );

    } catch (err) {

      console.log(err);

    }

  };


  // =====================================================
  // LOAD COURSES
  // =====================================================

  const loadCourses = async () => {

    try {

      const res =
        await axios.get(`${API}/courses`);

      setCourses(res.data);

    } catch (err) {

      console.log(err);

    }

  };


  // =====================================================
  // LOAD STUDENTS
  // =====================================================

  const loadStudents = async () => {

    try {

      const res =
        await axios.get(
          `${API}/quiz-assignments/students`
        );


      console.log(
        "Students:",
        res.data
      );


      setStudents(
        Array.isArray(res.data)
          ? res.data
          : []
      );

    } catch (err) {

      console.error(
        "Failed to load students:",
        err
      );

    }

  };


  // =====================================================
  // SAVE QUIZ
  // =====================================================

  const saveQuiz = async () => {

    try {

      if (editId) {

        await axios.put(
          `${API}/quizzes/${editId}`,
          form
        );

      } else {

        await axios.post(
          `${API}/quizzes`,
          form
        );

      }


      closeModal();
      loadQuizSets();

    } catch (err) {

      console.log(err);

    }

  };


  // =====================================================
  // EDIT QUIZ
  // =====================================================

  const editQuiz = (q: any) => {

    setEditId(q.id);

    setForm({
      title: q.title,
      topic: q.topic,
      difficulty: q.difficulty,
      course_id: String(q.course_id)
    });

    setModal(true);

  };


  // =====================================================
  // DELETE QUIZ
  // =====================================================

  const deleteQuiz = async (id: number) => {

    if (
      !confirm(
        "Delete this quiz set?\nQuestions will also be removed."
      )
    ) {
      return;
    }


    try {

      await axios.delete(
        `${API}/quizzes/${id}`
      );

      loadQuizSets();

    } catch (err) {

      console.log(err);

    }

  };


  // =====================================================
  // CLOSE QUIZ MODAL
  // =====================================================

  const closeModal = () => {

    setModal(false);

    setEditId(null);

    setForm(empty);

  };


  // =====================================================
  // OPEN PUBLISH MODAL
  // =====================================================

  const openPublishModal = (quiz: any) => {

    setSelectedQuiz(quiz);

    setAssignmentType("all");

    setSelectedStudents([]);

    setPublishModal(true);

  };


  // =====================================================
  // CLOSE PUBLISH MODAL
  // =====================================================

  const closePublishModal = () => {

    setPublishModal(false);

    setSelectedQuiz(null);

    setAssignmentType("all");

    setSelectedStudents([]);

  };


  // =====================================================
  // SELECT / UNSELECT STUDENT
  // =====================================================

  const toggleStudent = (
    studentId: number
  ) => {

    setSelectedStudents(prev => {

      if (prev.includes(studentId)) {

        return prev.filter(
          id => id !== studentId
        );

      }

      return [
        ...prev,
        studentId
      ];

    });

  };


  // =====================================================
  // PUBLISH QUIZ
  // =====================================================

  const publishQuiz = async () => {

    // ---------------------------------------------------
    // Check selected quiz
    // ---------------------------------------------------

    if (!selectedQuiz) {
      return;
    }


    // ---------------------------------------------------
    // Check selected students
    // ---------------------------------------------------

    if (
      assignmentType === "selected" &&
      selectedStudents.length === 0
    ) {

      alert(
        "Please select at least one student."
      );

      return;

    }


    // ---------------------------------------------------
    // Get logged-in instructor ID
    // ---------------------------------------------------

    const instructorId =
      getInstructorId();


    console.log(
      "Logged-in instructor ID:",
      instructorId
    );


    // ---------------------------------------------------
    // Stop if instructor ID cannot be found
    // ---------------------------------------------------

    if (!instructorId) {

      alert(
        "Instructor session not found. Please log in again."
      );

      return;

    }


    try {

      setPublishing(true);


      // -------------------------------------------------
      // Prepare assignment data
      // -------------------------------------------------

      const assignmentData = {

        quiz_set_id:
          selectedQuiz.id,

        assignment_type:
          assignmentType,

        student_ids:
          assignmentType === "selected"
            ? selectedStudents
            : [],

        assigned_by:
          instructorId

      };


      // -------------------------------------------------
      // Debug information
      // -------------------------------------------------

      console.log(
        "Publishing quiz:",
        assignmentData
      );


      // -------------------------------------------------
      // Send assignment to backend
      // -------------------------------------------------

      const response =
        await axios.post(
          `${API}/quiz-assignments`,
          assignmentData
        );


      // -------------------------------------------------
      // Debug server response
      // -------------------------------------------------

      console.log(
        "Publish response:",
        response.data
      );


      // -------------------------------------------------
      // Success message
      // -------------------------------------------------

      alert(
        assignmentType === "all"
          ? "Quiz published to all students!"
          : "Quiz published to selected students!"
      );


      // -------------------------------------------------
      // Close modal
      // -------------------------------------------------

      closePublishModal();


    } catch (err: any) {

      // -------------------------------------------------
      // Log complete error
      // -------------------------------------------------

      console.error(
        "Publish quiz error:",
        err
      );


      console.error(
        "Server response:",
        err?.response?.data
      );


      // -------------------------------------------------
      // Show backend error
      // -------------------------------------------------

      alert(
        err?.response?.data?.message ||
        "Failed to publish quiz."
      );


    } finally {

      setPublishing(false);

    }

  };


  return (

    <div className="min-h-screen bg-slate-300 p-8">


      {/* =================================================
          PAGE HEADER
      ================================================= */}

      <div className="mb-6">

        <h1 className="text-3xl font-bold text-slate-800">
          Quiz Set Management
        </h1>

        <p className="text-slate-900">
          Create, manage and publish adaptive quiz sets.
        </p>

      </div>


      {/* =================================================
          ADD QUIZ BUTTON
      ================================================= */}

      <button

        onClick={() => {

          setForm(empty);

          setEditId(null);

          setModal(true);

        }}

        className={`${btn} bg-blue-600 hover:bg-blue-700 mb-6`}

      >
        + Add Quiz Set

      </button>


      {/* =================================================
          QUIZ TABLE
      ================================================= */}

      <div
        className="
          bg-purple-400
          text-indigo-900
          rounded-2xl
          shadow-md
          overflow-hidden
        "
      >

        <table className="w-full">

          <thead className="bg-indigo-600 text-white">

            <tr>

              <th className="p-4 text-left">
                Title
              </th>

              <th>
                Course
              </th>

              <th>
                Topic
              </th>

              <th>
                Difficulty
              </th>

              <th>
                Action
              </th>

            </tr>

          </thead>


          <tbody>

            {quizSets.length === 0 ? (

              <tr>

                <td
                  colSpan={5}
                  className="
                    p-6
                    text-center
                    text-slate-500
                  "
                >
                  No quiz sets found.
                </td>

              </tr>

            ) : (

              quizSets.map(q => (

                <tr
                  key={q.id}
                  className="
                    border-b
                    hover:bg-blue-50
                    transition
                  "
                >

                  <td className="p-4 font-semibold">
                    {q.title}
                  </td>


                  <td className="text-center">
                    {q.course}
                  </td>


                  <td className="text-center">
                    {q.topic}
                  </td>


                  <td className="text-center">

                    <span
                      className={`
                        px-3
                        py-1
                        rounded-full
                        text-sm
                        font-semibold

                        ${
                          q.difficulty === "easy"
                            ? "bg-green-100 text-green-700"
                            : q.difficulty === "medium"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-red-100 text-red-700"
                        }
                      `}
                    >
                      {q.difficulty}
                    </span>

                  </td>


                  {/* ACTIONS */}

                  <td className="text-center">

                    <div className="flex justify-center gap-2 flex-wrap">

                      <button
                        onClick={() =>
                          editQuiz(q)
                        }
                        className={`${btn} bg-emerald-600 hover:bg-emerald-700`}
                      >
                        Edit
                      </button>


                      <button
                        onClick={() =>
                          openPublishModal(q)
                        }
                        className={`${btn} bg-indigo-600 hover:bg-indigo-700`}
                      >
                        Publish
                      </button>


                      <button
                        onClick={() =>
                          deleteQuiz(q.id)
                        }
                        className={`${btn} bg-red-600 hover:bg-red-700`}
                      >
                        Delete
                      </button>

                    </div>

                  </td>

                </tr>

              ))

            )}

          </tbody>

        </table>

      </div>


      {/* =================================================
          ADD / EDIT QUIZ MODAL
      ================================================= */}

      {modal && (

        <div
          className="
            fixed
            inset-0
            bg-black/50
            flex
            items-center
            justify-center
            z-50
            p-4
          "
        >

          <div
            className="
              bg-white
              rounded-2xl
              shadow-xl
              p-6
              w-[420px]
              max-w-full
            "
          >

            <h2
              className="
                text-2xl
                font-bold
                text-slate-800
                mb-5
              "
            >
              {editId
                ? "Edit Quiz Set"
                : "Add Quiz Set"}
            </h2>


            <input
              className={inputStyle}
              placeholder="Quiz Title"
              value={form.title}
              onChange={e =>
                setForm({
                  ...form,
                  title: e.target.value
                })
              }
            />


            <input
              className={inputStyle}
              placeholder="Topic"
              value={form.topic}
              onChange={e =>
                setForm({
                  ...form,
                  topic: e.target.value
                })
              }
            />


            <select
              className={inputStyle}
              value={form.difficulty}
              onChange={e =>
                setForm({
                  ...form,
                  difficulty: e.target.value
                })
              }
            >

              <option value="easy">
                Easy
              </option>

              <option value="medium">
                Medium
              </option>

              <option value="hard">
                Hard
              </option>

            </select>


            <select
              className={inputStyle}
              value={form.course_id}
              onChange={e =>
                setForm({
                  ...form,
                  course_id: e.target.value
                })
              }
            >

              <option value="">
                Select Course
              </option>

              {courses.map(c => (

                <option
                  key={c.id}
                  value={c.id}
                >
                  {c.title}
                </option>

              ))}

            </select>


            <div className="flex justify-end gap-3">

              <button
                onClick={closeModal}
                className={`${btn} bg-slate-500 hover:bg-slate-600`}
              >
                Cancel
              </button>


              <button
                disabled={
                  !form.title ||
                  !form.topic ||
                  !form.course_id
                }
                onClick={saveQuiz}
                className="
                  bg-blue-600
                  hover:bg-blue-700
                  disabled:opacity-50
                  text-white
                  px-5
                  py-2
                  rounded-xl
                "
              >
                {editId
                  ? "Update"
                  : "Save"}
              </button>

            </div>

          </div>

        </div>

      )}


      {/* =================================================
          PUBLISH QUIZ MODAL
      ================================================= */}

      {publishModal && selectedQuiz && (

        <div
          className="
            fixed
            inset-0
            bg-black/50
            flex
            items-center
            justify-center
            z-50
            p-4
          "
        >

          <div
            className="
              bg-white
              rounded-2xl
              shadow-xl
              p-6
              w-[520px]
              max-w-full
              max-h-[90vh]
              overflow-y-auto
            "
          >

            {/* HEADER */}

            <div className="mb-5">

              <h2
                className="
                  text-2xl
                  font-bold
                  text-slate-800
                "
              >
                Publish Quiz
              </h2>

              <p className="text-slate-600 mt-1">
                {selectedQuiz.title}
              </p>

            </div>


            {/* =================================================
                PUBLISH OPTIONS
            ================================================= */}

            <div className="space-y-3 mb-5">

              {/* ALL STUDENTS */}

              <label
                className="
                  flex
                  items-center
                  gap-3
                  border
                  rounded-xl
                  p-4
                  cursor-pointer
                  hover:bg-blue-50
                "
              >

                <input
                  type="radio"
                  name="assignmentType"
                  checked={
                    assignmentType === "all"
                  }
                  onChange={() =>
                    setAssignmentType("all")
                  }
                />

                <div>

                  <p className="font-semibold text-slate-800">
                    All Students
                  </p>

                  <p className="text-sm text-slate-500">
                    Make this quiz available to every student.
                  </p>

                </div>

              </label>


              {/* SELECTED STUDENTS */}

              <label
                className="
                  flex
                  items-center
                  gap-3
                  border
                  rounded-xl
                  p-4
                  cursor-pointer
                  hover:bg-blue-50
                "
              >

                <input
                  type="radio"
                  name="assignmentType"
                  checked={
                    assignmentType === "selected"
                  }
                  onChange={() =>
                    setAssignmentType("selected")
                  }
                />

                <div>

                  <p className="font-semibold text-slate-800">
                    Selected Students
                  </p>

                  <p className="text-sm text-slate-500">
                    Make this quiz available only to selected students.
                  </p>

                </div>

              </label>

            </div>


            {/* =================================================
                STUDENT LIST
            ================================================= */}

            {assignmentType === "selected" && (

              <div className="mb-5">

                <h3
                  className="
                    font-semibold
                    text-slate-800
                    mb-3
                  "
                >
                  Select Students
                </h3>


                {students.length === 0 ? (

                  <div
                    className="
                      border
                      rounded-xl
                      p-4
                      text-center
                      text-slate-500
                    "
                  >
                    No students found.
                  </div>

                ) : (

                  <div
                    className="
                      border
                      rounded-xl
                      max-h-64
                      overflow-y-auto
                    "
                  >

                    {students.map(student => {

                      const checked =
                        selectedStudents.includes(
                          student.id
                        );


                      return (

                        <label
                          key={student.id}
                          className="
                            flex
                            items-center
                            gap-3
                            p-4
                            border-b
                            last:border-b-0
                            cursor-pointer
                            hover:bg-slate-50
                          "
                        >

                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() =>
                              toggleStudent(
                                student.id
                              )
                            }
                          />


                          <div>

                            <p className="font-semibold text-slate-800">
                              {student.name}
                            </p>

                            <p className="text-sm text-slate-500">
                              {student.email}
                            </p>

                          </div>

                        </label>

                      );

                    })}

                  </div>

                )}


                {selectedStudents.length > 0 && (

                  <p
                    className="
                      text-sm
                      text-blue-600
                      mt-2
                    "
                  >
                    {selectedStudents.length} student(s) selected.
                  </p>

                )}

              </div>

            )}


            {/* =================================================
                BUTTONS
            ================================================= */}

            <div
              className="
                flex
                justify-end
                gap-3
              "
            >

              <button
                onClick={closePublishModal}
                className={`${btn} bg-slate-500 hover:bg-slate-600`}
              >
                Cancel
              </button>


              <button
                onClick={publishQuiz}
                disabled={
                  publishing ||
                  (
                    assignmentType === "selected" &&
                    selectedStudents.length === 0
                  )
                }
                className="
                  bg-indigo-600
                  hover:bg-indigo-700
                  disabled:opacity-50
                  text-white
                  px-5
                  py-2
                  rounded-xl
                "
              >

                {publishing
                  ? "Publishing..."
                  : "Publish Quiz"}

              </button>

            </div>

          </div>

        </div>

      )}

    </div>

  );

}