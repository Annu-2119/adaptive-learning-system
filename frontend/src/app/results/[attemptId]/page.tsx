"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "next/navigation";

export default function ResultPage() {
  const params = useParams();

  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    axios
      .get(`http://localhost:5000/api/results/${params.attemptId}`)
      .then((res) => {
        setResult(res.data);
      })
      .catch((err) => {
        console.error(err);
      });
  }, [params.attemptId]);


  if (!result) {
    return (
      <div className="min-h-screen bg-slate-400 flex items-center justify-center">
        <div className="bg-white p-8 rounded-2xl shadow">
          <p className="text-slate-700 font-semibold">
            Loading results...
          </p>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-slate-400 p-8">

      <div className="
        max-w-5xl
        mx-auto
        bg-indigo-400
        rounded-3xl
        shadow-xl
        border
        border-slate-200
        p-8
      ">

        <div
          className="
          bg-gradient-to-r
          from-blue-600
          via-indigo-600
          to-purple-600
          rounded-3xl
          p-8
          text-white
          mb-8
          "
        >

          <h1 className="text-4xl font-bold">
            Quiz Results 
          </h1>

          <p className="mt-3 text-blue-100 text-lg">
            Review your performance and personalized learning recommendation.
          </p>

        </div>

        <div className="
          grid
          md:grid-cols-2
          gap-6
          mb-8
        ">

          <div
            className="
            bg-white
            border
            border-slate-200
            rounded-2xl
            shadow-md
            p-6
            "
          >

            <p className="text-slate-900">
              Final Score
            </p>

            <h2
              className="
              text-5xl
              font-bold
              text-blue-600
              mt-3
              "
            >
              {result.score}%
            </h2>

          </div>

          <div
            className="
            bg-white
            border
            border-slate-200
            rounded-2xl
            shadow-md
            p-6
            "
          >

            <p className="text-slate-900">
              Mastery Status
            </p>

            <h2
              className="
              text-3xl
              font-bold
              text-green-600
              mt-3
              "
            >

              {result.mastered
                ? "Mastered ✅"
                : "Keep Practicing"}

            </h2>


          </div>


        </div>

        <div
          className="
          bg-red-200
          border
          border-red-200
          rounded-2xl
          p-6
          mb-6
          "
        >

          <h2 className="
          font-bold
          text-red-700
          text-xl
          ">
            Weakest Topic
          </h2>


          <p className="
          text-slate-800
          text-lg
          font-semibold
          mt-2
          ">
            {result.weak_topic || "None"}
          </p>


        </div>

        <div
          className="
          bg-indigo-200
          border
          border-indigo-200
          rounded-2xl
          p-6
          mb-6
          "
        >

          <h2
            className="
            text-xl
            font-bold
            text-indigo-700
            "
          >
            Recommended Quiz
          </h2>


          <div className="mt-4 space-y-2 text-slate-700">

            <p>
              <strong>Difficulty:</strong>{" "}
              {result.recommended_level || "Not Available"}
            </p>


            <p>
              <strong>Next Quiz:</strong>{" "}
              {result.recommended_quiz || "No recommendation"}
            </p>

          </div>


        </div>

        <div
          className="
          bg-gray-100
          border
          border-blue-200
          rounded-2xl
          p-6
          mb-8
          "
        >

          <h2
            className="
            text-xl
            font-bold
            text-blue-700
            mb-3
            "
          >
            Instructor Feedback
          </h2>


          <p className="text-slate-700">

            {result.feedback ??
              "No feedback has been provided yet."}

          </p>


        </div>

        <h2
          className="
          text-3xl
          font-bold
          text-slate-900
          mb-6
          "
        >
          Question Review
        </h2>

        {
          result.answers?.length > 0 ? (

            result.answers.map(
              (answer:any,index:number)=>(

              <div
                key={index}
                className="
                bg-white
                border
                border-slate-200
                rounded-2xl
                shadow-md
                p-6
                mb-6
                hover:shadow-lg
                transition
                "
              >

                <h3
                  className="
                  text-lg
                  font-bold
                  text-slate-900
                  mb-3
                  "
                >

                  Question {index+1}

                </h3>

                <p className="
                text-slate-900
                mb-5
                ">
                  {answer.question_text}
                </p>

                {
                  answer.is_correct ? (

                    <span
                    className="
                    bg-green-100
                    text-green-700
                    px-4
                    py-2
                    rounded-full
                    font-semibold
                    "
                    >
                      ✔ Correct
                    </span>

                  ):(

                    <span
                    className="
                    bg-red-100
                    text-red-700
                    px-4
                    py-2
                    rounded-full
                    font-semibold
                    "
                    >
                      ✘ Incorrect
                    </span>

                  )
                }

                <p className="
                mt-5
                text-slate-900
                ">
                  <strong>
                    Marks:
                  </strong>{" "}
                  {answer.marks_awarded} / {answer.marks}
                </p>

                <p className="
                mt-4
                font-semibold
                text-slate-900
                ">
                  Your Answer
                </p>

                <div
                className="
                bg-slate-50
                border
                border-slate-200
                rounded-xl
                p-4
                mt-2
                text-slate-900
                "
                >

                  {answer.student_answer || "No answer"}

                </div>

                <p className="
                mt-4
                font-semibold
                text-slate-900
                ">
                  Correct Answer
                </p>

                <div
                className="
                bg-green-50
                border
                border-green-200
                rounded-xl
                p-4
                mt-2
                text-green-800
                "
                >

                  {answer.correct_answer}

                </div>

              </div>

            ))

          ):(

            <div
            className="
            bg-slate-50
            border
            rounded-xl
            p-6
            text-slate-900
            "
            >

              No question review available.

            </div>

          )
        }

      </div>
    </div>
  );
}
