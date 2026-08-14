"use client";

import { useState } from "react";
import axios from "axios";

export default function Register() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    role: "student",
  });

  const registerUser = async () => {
    try {
      const res = await axios.post(
        "https://adaptive-learning-system-5a2d.onrender.com/api/auth/register",
        form
      );

      alert(res.data.message);
    } catch (err: any) {
      alert(err.response.data.message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-[#20315a] via-[#344e97] to-[#5281e6]">
    <div className="max-w-md mx-auto mt-20 p-5 bg-gradient-to-br from-black via-gray-900 to-slate-900 rounded shadow">
      <h1 className="text-2xl font-bold mb-4">Register</h1>

      <input
        type="text"
        placeholder="Name"
        aria-label="Full Name"
        className="border p-2 w-full mb-3"
        onChange={(e) =>
          setForm({
            ...form,
            name: e.target.value,
          })
        }
      />

      <input
        type="email"
        placeholder="Email"
        aria-label="Email Address"
        className="border p-2 w-full mb-3"
        onChange={(e) =>
          setForm({
            ...form,
            email: e.target.value,
          })
        }
      />

      <select
        className="border p-2 w-full mb-3 bg-white text-black"
        aria-label="User Role"
        onChange={(e) =>
          setForm({
            ...form,
            role: e.target.value,
          })
        }
      >
        <option value="student">Student</option>
        <option value="instructor">Instructor</option>
      </select>

      <button
        onClick={registerUser}
        aria-label="Register Account"
        className="bg-blue-700 text-white px-4 py-2 rounded w-full"
      >
        Register
      </button>
    </div>
  </div>
  );
}