"use client";

import { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";

export default function Login() {
  const router = useRouter();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const loginUser = async () => {
    try {
      const res = await axios.post(
        "http://localhost:5000/api/auth/login",
        form
      );

      Cookies.set("token", res.data.token);

      Cookies.set("user", JSON.stringify(res.data.user));

      if (res.data.user.role === "student") {
        router.push("/student");
      } else {
        router.push("/instructor");
      }
    } catch (err: any) {
      console.error(err);
      alert("Login Failed");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-[#20315a] via-[#344e97] to-[#5281e6]">
    <div className="max-w-md mx-auto mt-20 p-5 bg-gradient-to-br from-black via-gray-900 to-slate-900 rounded shadow">
      <h1 className="text-2xl font-bold mb-4 text-white">
        Login
      </h1>

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

      <input
        type="password"
        placeholder="Password"
        aria-label="Password"
        className="border p-2 w-full mb-3"
        onChange={(e) =>
          setForm({
            ...form,
            password: e.target.value,
          })
        }
      />

      <button
        aria-label="Login Button"
        onClick={loginUser}
        className="bg-blue-700 text-white px-4 py-2 rounded w-full"
      >
        Login
      </button>
    </div>

  </div>
  );
}