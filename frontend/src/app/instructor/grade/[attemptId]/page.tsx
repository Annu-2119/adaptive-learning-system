"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Save,
} from "lucide-react";

type Answer = {
  question_id: number;

  question_text: string;
  question_type: string;

  correct_answer: string;

  marks: number;
  topic: string;

  answer_id: number | null;

  student_answer: string | null;

  marks_awarded: number;

  is_correct: number | string | null;
};

export default function GradePage() {
  const { attemptId } = useParams();

  const router = useRouter();

  const [answers, setAnswers] = useState<Answer[]>([]);

  const [loading, setLoading] = useState(true);

  const [manualMarks, setManualMarks] = useState<{
    [key: number]: number;
  }>({});

  const loadAnswers = async () => {
    if (!attemptId) return;

    try {
      setLoading(true);

      const res = await axios.get(
        `http://localhost:5000/api/grading/${attemptId}`
      );

      console.log(
        "Instructor grading data:",
        res.data
      );

      const data = Array.isArray(res.data)
        ? res.data
        : [];

      setAnswers(data);

      const marks: {
        [key: number]: number;
      } = {};

      data.forEach((a: Answer) => {
        if (a.answer_id !== null) {
          marks[a.answer_id] = Number(
            a.marks_awarded || 0
          );
        }
      });

      setManualMarks(marks);
    } catch (err) {
      console.error(
        "Failed to load grading data:",
        err
      );

      setAnswers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnswers();
  }, [attemptId]);

  const saveMarks = async (answerId: number) => {
    try {
      const marks = Number(
        manualMarks[answerId] || 0
      );

      await axios.post(
        "http://localhost:5000/api/grading/mark",
        {
          answerId,
          marks,
        }
      );

      alert("Marks saved successfully!");

      await loadAnswers();
    } catch (err) {
      console.error(
        "Failed to save marks:",
        err
      );

      alert("Failed to save marks.");
    }
  };

  if (loading) {
    return (
      <div
        className="
          min-h-screen
          bg-slate-100
          flex
          items-center
          justify-center
        "
      >
        <p className="text-xl font-semibold text-slate-700">
          Loading grading data...
        </p>
      </div>
    );
  }

  const totalQuestions = answers.length;

  const answeredQuestions = answers.filter(
    (a) =>
      a.student_answer !== null &&
      a.student_answer !== undefined &&
      String(a.student_answer).trim() !== ""
  ).length;

  const unansweredQuestions =
    totalQuestions - answeredQuestions;

  const correctAnswers = answers.filter(
    (a) => Number(a.is_correct) === 1
  ).length;

  const incorrectAnswers = answers.filter(
    (a) =>
      Number(a.is_correct) === 0 &&
      a.student_answer !== null &&
      a.student_answer !== undefined &&
      String(a.student_answer).trim() !== ""
  ).length;

  return (
    <div
      className="
        min-h-screen
        bg-slate-300
        p-8
      "
    >
      <div className="max-w-6xl mx-auto">

        <div
          className="
            bg-gradient-to-r
            from-blue-600
            via-indigo-600
            to-purple-600
            rounded-3xl
            shadow-xl
            p-8
            text-white
            mb-8
          "
        >
          <button
            onClick={() => router.back()}
            className="
              flex
              items-center
              gap-2
              bg-white/20
              hover:bg-white/30
              px-4
              py-2
              rounded-xl
              mb-5
            "
          >
            <ArrowLeft size={18} />

            Back
          </button>

          <h1 className="text-4xl font-bold">
            Grade Student Quiz
          </h1>

          <p className="mt-3 text-blue-100">
            Review all student questions
            and answers.
          </p>
        </div>

        <div
          className="
            grid
            md:grid-cols-4
            gap-6
            mb-8
          "
        >
          <div
            className="
              bg-white
              rounded-2xl
              shadow-md
              border
              p-6
            "
          >
            <p className="text-slate-900">
              Total Questions
            </p>

            <h2
              className="
                text-4xl
                font-bold
                text-blue-600
                mt-2
              "
            >
              {totalQuestions}
            </h2>
          </div>

          <div
            className="
              bg-white
              rounded-2xl
              shadow-md
              border
              p-6
            "
          >
            <p className="text-slate-900">
              Answered
            </p>

            <h2
              className="
                text-4xl
                font-bold
                text-indigo-600
                mt-2
              "
            >
              {answeredQuestions}
            </h2>
          </div>

          <div
            className="
              bg-white
              rounded-2xl
              shadow-md
              border
              p-6
            "
          >
            <p className="text-slate-900">
              Correct Answers
            </p>

            <h2
              className="
                text-4xl
                font-bold
                text-green-600
                mt-2
              "
            >
              {correctAnswers}
            </h2>
          </div>

          <div
            className="
              bg-white
              rounded-2xl
              shadow-md
              border
              p-6
            "
          >
            <p className="text-slate-900">
              Unanswered
            </p>

            <h2
              className="
                text-4xl
                font-bold
                text-red-600
                mt-2
              "
            >
              {unansweredQuestions}
            </h2>
          </div>
        </div>

        {answers.length === 0 ? (
          <div
            className="
              bg-white
              rounded-2xl
              shadow
              p-8
              text-center
              text-slate-900
            "
          >
            No questions found.
          </div>
        ) : (
          answers.map((a, index) => {

            const isUnanswered =
              a.student_answer === null ||
              a.student_answer === undefined ||
              String(a.student_answer).trim() === "";

            const isCorrect =
              Number(a.is_correct) === 1;

            return (
              <div
                key={
                  a.question_id ||
                  index
                }
                className="
                  bg-gray-100
                  rounded-3xl
                  shadow-md
                  border
                  p-8
                  mb-6
                  hover:shadow-xl
                  transition
                "
              >

                <div
                  className="
                    flex
                    justify-between
                    items-start
                    gap-4
                  "
                >
                  <div>
                    <p
                      className="
                        text-sm
                        font-semibold
                        text-indigo-600
                        mb-2
                      "
                    >
                      Question {index + 1}
                    </p>

                    <h3
                      className="
                        text-xl
                        font-bold
                        text-slate-900
                      "
                    >
                      {a.question_text}
                    </h3>
                  </div>

                  {isUnanswered ? (
                    <span
                      className="
                        flex
                        items-center
                        gap-1
                        bg-gray-200
                        text-gray-700
                        px-3
                        py-1
                        rounded-full
                        text-sm
                        font-semibold
                        whitespace-nowrap
                      "
                    >
                      Unanswered
                    </span>
                  ) : isCorrect ? (
                    <span
                      className="
                        flex
                        items-center
                        gap-1
                        bg-green-100
                        text-green-700
                        px-3
                        py-1
                        rounded-full
                        text-sm
                        font-semibold
                        whitespace-nowrap
                      "
                    >
                      <CheckCircle size={16} />

                      Correct
                    </span>
                  ) : (
                    <span
                      className="
                        flex
                        items-center
                        gap-1
                        bg-red-100
                        text-red-700
                        px-3
                        py-1
                        rounded-full
                        text-sm
                        font-semibold
                        whitespace-nowrap
                      "
                    >
                      <XCircle size={16} />

                      Wrong
                    </span>
                  )}
                </div>

                <div
                  className="
                    grid
                    md:grid-cols-2
                    gap-5
                    mt-6
                  "
                >

                  <div
                    className="
                      bg-slate-100
                      rounded-xl
                      p-5
                    "
                  >
                    <h4
                      className="
                        font-semibold
                        text-slate-900
                        mb-2
                      "
                    >
                      Student Answer
                    </h4>

                    <p className="text-slate-900">
                      {isUnanswered
                        ? "No answer provided"
                        : a.student_answer || "-"}
                    </p>
                  </div>

                  <div
                    className="
                      bg-green-50
                      rounded-xl
                      p-5
                      border
                      border-green-200
                    "
                  >
                    <h4
                      className="
                        font-semibold
                        text-green-700
                        mb-2
                      "
                    >
                      Correct Answer
                    </h4>

                    <p className="text-slate-900">
                      {a.correct_answer || "-"}
                    </p>
                  </div>
                </div>

                <div
                  className="
                    mt-5
                    flex
                    justify-between
                    items-center
                  "
                >
                  <p className="text-slate-900">
                    <strong>
                      Marks:
                    </strong>{" "}

                    {Number(
                      a.marks_awarded || 0
                    )}

                    {" / "}

                    {Number(
                      a.marks || 0
                    )}
                  </p>

                  <p className="text-slate-700">
                    <strong>
                      Topic:
                    </strong>{" "}

                    {a.topic || "-"}
                  </p>
                </div>

                {a.question_type ===
                  "subjective" &&
                  a.answer_id !== null && (
                    <div
                      className="
                        mt-6
                        bg-blue-50
                        rounded-xl
                        p-5
                        border
                        border-blue-200
                      "
                    >
                      <h4
                        className="
                          font-semibold
                          text-blue-800
                          mb-3
                        "
                      >
                        Manual Marking
                      </h4>

                      <div
                        className="
                          flex
                          gap-3
                          items-center
                          text-black
                        "
                      >
                        <input
                          type="number"
                          min={0}
                          max={Number(
                            a.marks || 0
                          )}
                          className="
                            border
                            rounded-xl
                            p-3
                            w-28
                            text-center
                          "
                          value={
                            manualMarks[
                              a.answer_id
                            ] ??
                            Number(
                              a.marks_awarded ||
                                0
                            )
                          }
                          onChange={(e) =>
                            setManualMarks(
                              (prev) => ({
                                ...prev,
                                [a.answer_id!]:
                                  Number(
                                    e.target.value
                                  ),
                              })
                            )
                          }
                        />

                        <span className="text-slate-900">
                          /
                          {" "}
                          {Number(
                            a.marks || 0
                          )}
                        </span>

                        <button
                          onClick={() =>
                            saveMarks(
                              a.answer_id!
                            )
                          }
                          className="
                            flex
                            items-center
                            gap-2
                            bg-blue-600
                            hover:bg-blue-700
                            text-white
                            px-5
                            py-3
                            rounded-xl
                          "
                        >
                          <Save size={18} />

                          Save Marks
                        </button>
                      </div>
                    </div>
                  )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}