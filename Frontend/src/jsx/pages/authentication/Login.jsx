import React, { useState } from "react";
import { connect, useDispatch } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";

import {
  getDeveloperHomeRoute,
  isDeveloperUser,
} from "../../../utils/developer";
import { loadingToggleAction } from "../../../store/actions/AuthActions";

import logo from "../../../assets/images/logo.webp";
import logo2 from "../../../assets/images/logo-full.png";
import pic1 from "../../../assets/images/bgimg2.jpg";

function Login() {
  const [openEyes, setOpenEyes] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const [errors, setErrors] = useState({
    email: "",
    password: "",
  });

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const onLogin = async (e) => {
    e.preventDefault();

    let error = false;
    const errorObj = { email: "", password: "" };

    if (!email) {
      errorObj.email = "Email is Required";
      error = true;
    }
    if (!password) {
      errorObj.password = "Password is Required";
      error = true;
    }

    setErrors(errorObj);
    if (error) return;

    try {
      setLoading(true);
      dispatch(loadingToggleAction(true));

      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_API_URL}login/loginuser`,
        { email, password }
      );

      const data = response.data;

      if (data.token) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));

        navigate(
          isDeveloperUser(data.user) ? getDeveloperHomeRoute() : "/user-dashboard"
        );
        toast.success("Login successful! Welcome back", {
          position: "top-right",
          autoClose: 3000,
        });

      } else {
        toast.error(data.message || "Login failed!", {
          position: "top-right",
          autoClose: 3000,
        });
      }

    } catch (error) {
      toast.error(
        error.response?.data?.message || "Something went wrong!",
        {
          position: "top-right",
          autoClose: 3000,
        }
      );
    } finally {
      setLoading(false);
      dispatch(loadingToggleAction(false));
    }
  };

  return (
    <div className="authincation d-flex flex-column flex-lg-row flex-column-fluid">

      {/* LEFT SIDE */}
      <div className="login-aside text-center d-none d-sm-flex flex-column flex-row-auto">
        <div className="d-flex flex-column-auto flex-column mt-5 pt-5 ">
          <div className="text-center">
            {/* <Link to="/">
              <img src={logo} className="dark-login" alt="logo" />
            </Link>
            <Link to="/">
              <img src={logo2} className="light-login" alt="logo" />
            </Link> */}
          </div>
          <h2 className="mb-2 fw-bold">Welcome To KLK Ventures Pvt Ltd.</h2>
          <p>
            Your centralized expense management dashboard <br />
            for smarter financial control
          </p>
        </div>
        <div
          className="aside-image"
          style={{ backgroundImage: `url(${pic1})` }}
        ></div>
      </div>

      {/* RIGHT SIDE */}
      <div className="container flex-row-fluid d-flex flex-column justify-content-center position-relative overflow-hidden mx-auto">
        <div className="d-flex justify-content-center align-items-center">
          <div className="authincation-content style-2">
            <div className="row no-gutters">
              <div className="col-xl-12 tab-content">
                <div className="auth-form form-validation">

                  <form onSubmit={onLogin}>

                    <div className="text-center mb-4">
                      <Link to="/">
                        <img src={logo} className="dark-login" alt="logo" />
                      </Link>
                      <Link to="/">
                        <img src={logo2} className="light-login" alt="logo" />
                      </Link>
                    </div>
                    <h3 className="text-center mb-4 text-black">
                      Sign in your account
                    </h3>

                    {/* EMAIL */}
                    <div className="form-group mb-3">
                      <label className="form-label required">Email</label>
                      <input
                        type="email"
                        className="form-control"
                        value={email}
                        autoComplete="username"
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email"
                      />
                      {errors.email && (
                        <div className="text-danger fs-12">{errors.email}</div>
                      )}
                    </div>

                    {/* PASSWORD */}
                    <div className="form-group mb-3">
                      <label className="form-label required">Password</label>
                      <div className="position-relative">
                        <input
                          type={openEyes ? "password" : "text"}
                          className="form-control"
                          value={password}
                          autoComplete="current-password"
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Enter password"
                        />
                        <span
                          className={`show-pass eye ${openEyes ? "" : "active"}`}
                          onClick={() => setOpenEyes(!openEyes)}
                          style={{
                            position: "absolute",
                            right: "10px",
                            top: "50%",
                            transform: "translateY(-50%)",
                            cursor: "pointer",
                          }}
                        >
                          {openEyes ? (
                            <i className="fa fa-eye-slash"></i>
                          ) : (
                            <i className="fa fa-eye"></i>
                          )}
                        </span>
                      </div>
                      {errors.password && (
                        <div className="text-danger fs-12">{errors.password}</div>
                      )}
                    </div>

                    {/* REMEMBER */}
                    <div className="form-group mb-3">
                      <div className="form-check">
                        <input
                          type="checkbox"
                          className="form-check-input"
                          id="remember"
                        />
                        <label className="form-check-label" htmlFor="remember">
                          Remember me
                        </label>
                      </div>
                    </div>

                    {/*   BUTTON - loading state ke saath */}
                    <div className="text-center mb-3">
                      <button
                        type="submit"
                        className="btn btn-primary btn-block w-100"
                        disabled={loading}
                      >
                        {loading ? "Signing in..." : "Sign In"}
                      </button>
                    </div>
                  </form>

                  {/* SIGNUP */}
                  <div className="text-center">
                    <p>
                      Don't have an account?{" "}
                      <Link className="text-primary" to="/page-register">
                        Sign Up
                      </Link>
                    </p>
                  </div>

                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}

const mapStateToProps = (state) => ({
  errorMessage: state.auth.errorMessage,
  successMessage: state.auth.successMessage,
  showLoading: state.auth.showLoading,
});

export default connect(mapStateToProps)(Login);