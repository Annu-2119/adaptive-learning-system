"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { useParams, useRouter, useSearchParams } from "next/navigation";

export default function QuizPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  const courseId = Number(params.id);

  const startSet = searchParams.get("startSet");
  const isRecommendedMode = !!startSet;

  const [quizSets, setQuizSets] = useState<any[]>([]);
  const [currentSetIndex, setCurrentSetIndex] = useState(0);

  const [allQuestions, setAllQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<any>({});
  const [loading, setLoading] = useState(false);

  /*
      Load quizzes

      Normal Mode:
      - Load every quiz set

      Recommended Mode:
      - Load ONLY one quiz set
  */

  useEffect(() => {
    const loadQuiz = async () => {
      try {
        if (isRecommendedMode) {

          const quizRes = await axios.get(
            `http://localhost:5000/api/quizzes/set/${startSet}`
          );

          setQuizSets([quizRes.data]);

          const questionRes = await axios.get(
            `http://localhost:5000/api/questions/quizset/${startSet}`
          );

          setAllQuestions(questionRes.data);

          setCurrentSetIndex(0);
        } else {
 
          const res = await axios.get(
            `http://localhost:5000/api/quizzes/${courseId}`
          );

          setQuizSets(res.data);

          const all = await Promise.all(
            res.data.map((set: any) =>
              axios.get(
                `http://localhost:5000/api/questions/quizset/${set.id}`
              )
            )
          );

          setAllQuestions(all.flatMap((r) => r.data));
        }
      } catch (err) {
        console.error("Error loading quizzes:", err);
      }
    };

    loadQuiz();
  }, [courseId, startSet]);

  const currentSet = quizSets[currentSetIndex];

  const currentQuestions = allQuestions.filter(
    (q) => q.quiz_set_id === currentSet?.id
  );

  const handleAnswer = (questionId: number, answer: string) => {
    setAnswers((prev: any) => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  const submitQuiz = async () => {
    try {
      setLoading(true);

      const user = JSON.parse(Cookies.get("user") || "{}");

      if (!user.id) {
        alert("User session not found.");
        router.push("/login");
        return;
      }

      const res = await axios.post(
        "http://localhost:5000/api/submitQuiz",
        {
          studentId: user.id,
          courseId,
          quizSetId: startSet
            ? Number(startSet)
            : currentSet.id,
          answers,

          attemptType: isRecommendedMode
            ? "recommended"
            : "normal",
        }
      );

      alert("Quiz submitted successfully!");

      if (isRecommendedMode) {
        router.push("/student");
      } else {
        router.push(`/results/${res.data.attemptId}`);
      }
    } catch (err) {
      console.error(err);
      alert("Quiz submission failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-300 p-8">
      <div className="max-w-4xl mx-auto">

        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white rounded-3xl shadow-xl p-8 mb-8">
          <h1 className="text-4xl font-bold">
            Quiz Assessment
          </h1>

          <p className="text-blue-100 mt-3">
            {currentSet?.title || "Loading..."}
          </p>

          <p className="text-blue-200 text-sm mt-1">
            Set {currentSetIndex + 1} of {quizSets.length}
          </p>
        </div>

        {currentQuestions.map((q) => (
          <div
            key={q.id}
            className="bg-white rounded-2xl shadow-md border border-slate-200 p-8 mb-6"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-lg text-slate-800">
                {q.question_text}
              </h3>

              <span className="bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-semibold">
                {q.marks} Mark{q.marks > 1 ? "s" : ""}
              </span>
            </div>

            {q.question_type === "mcq" ? (
              <div className="space-y-2 text-black">
                {[q.option_a, q.option_b, q.option_c, q.option_d]
                  .filter(Boolean)
                  .map((option: string) => (
                    <label key={option} className="block cursor-pointer">
                      <input
                        type="radio"
                        name={`q-${q.id}`}
                        value={option}
                        checked={answers[q.id] === option}
                        onChange={(e) =>
                          handleAnswer(q.id, e.target.value)
                        }
                      />

                      <span className="ml-2">
                        {option}
                      </span>
                    </label>
                  ))}
              </div>
            ) : (
              <textarea
                rows={5}
                className="w-full border text-black border-slate-300 rounded-xl p-4 focus:ring-2 focus:ring-blue-500 outline-none"
                value={answers[q.id] || ""}
                onChange={(e) =>
                  handleAnswer(q.id, e.target.value)
                }
              />
            )}
          </div>
        ))}

        <div className="flex justify-between mt-6">

          {!isRecommendedMode && (
            <button
              onClick={() =>
                setCurrentSetIndex((prev) =>
                  Math.max(prev - 1, 0)
                )
              }
              disabled={currentSetIndex === 0}
              className="bg-slate-500 hover:bg-slate-600 text-white px-5 py-3 rounded-xl disabled:opacity-50"
            >
              Previous Set
            </button>
          )}

          {isRecommendedMode ||
          currentSetIndex === quizSets.length - 1 ? (
            <button
              onClick={submitQuiz}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl"
            >
              {loading ? "Submitting..." : "Submit Quiz"}
            </button>
          ) : (
            !isRecommendedMode && (
              <button
                onClick={() =>
                  setCurrentSetIndex((prev) =>
                    Math.min(prev + 1, quizSets.length - 1)
                  )
                }
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl"
              >
                Next Set
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
}