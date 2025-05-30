import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import Textbox from "../components/Textbox";
import Button from "../components/Button";
import devX from "../assets/images/devx.jpg";
import { useDispatch, useSelector } from "react-redux";
import { setCredentials } from "../redux/slices/authSlice";


const Login = () => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [step, setStep] = useState("email"); // 'email' or 'code'
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  // Redirect if user is already logged in
  useEffect(() => {
    if (user) navigate("/Landing");
  }, [user, navigate]);

  // Step 1: Submit email for code
  const handleEmailSubmit = async (data) => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.email }),
      });
      const resData = await response.json();
      if (!response.ok) throw new Error(resData.msg || "Error sending code");
      setEmail(data.email);
      setStep("code");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      reset();
    }
  };

  // Step 2: Submit code for verification
  const handleCodeSubmit = async (data) => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("http://localhost:5000/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: data.code }),
      });
      const resData = await response.json();
      if (!response.ok) throw new Error(resData.msg || "Invalid code");

      // Dispatch user info to Redux
      dispatch(setCredentials(resData.user));
      navigate("/Landing");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      reset();
    }
  };

  return (
    <div className="w-full min-h-screen flex items-center justify-center flex-col lg:flex-row bg-[#F5F5F5]">
      <div className="w-full md:1/3 p-4 md:p-1 flex flex-col justify-center items-center gap-4">
        <div className="w-full gap-0.5 flex flex-row justify-center items-center">
          <img src={devX} alt="" className="p-2 rounded-full w-20" />
          <p className="flex flex-col gap-0 md:gap-4 text-2xl md:text-5xl 2xl:text-6xl font-black text-center text-black">
            Mavrauder Collection
          </p>
        </div>

        <form
          onSubmit={handleSubmit(step === "email" ? handleEmailSubmit : handleCodeSubmit)}
          className="form-container w-full md:w-[700px] flex flex-col gap-y-6 bg-white px-10 pt-10 pb-14"
        >
          <div className="">
            <p className="text-black text-3xl font-bold text-start">
              {step === "email" ? "Log in" : "Enter Code"}
            </p>
            <p className="text-base text-gray-400">
              {step === "email"
                ? "Enter your email and we'll send you a login code"
                : "Enter the code we sent to your email"}
            </p>
          </div>

          {error && <p className="text-red-500">{error}</p>}

          <div className="flex flex-col gap-y-5">
            {step === "email" ? (
              <Textbox
                placeholder="Email"
                type="email"
                name="email"
                label=""
                className="w-full rounded-xl"
                register={register("email", {
                  required: "Email is required!",
                })}
                error={errors.email ? errors.email.message : ""}
              />
            ) : (
              <Textbox
                placeholder="Enter code"
                type="text"
                name="code"
                label=""
                className="w-full rounded-xl"
                register={register("code", {
                  required: "Code is required!",
                })}
                error={errors.code ? errors.code.message : ""}
              />
            )}

            <Button
              type="submit"
              label={loading ? "Loading..." : step === "email" ? "Send Code" : "Verify"}
              className="w-full h-10 bg-black text-white rounded-full"
              disabled={loading}
            />
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
