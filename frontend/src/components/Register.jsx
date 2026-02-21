import { useState } from "react";

export default function Register({
	setPage,
	setToken,
	onToggleNightMode,
	nightMode,
}) {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [msg, setMsg] = useState("");

	const handleRegister = async (e) => {
		e.preventDefault();
		const trimmedEmail = email.trim();

		if (!trimmedEmail.includes("@")) {
			setMsg("Email must contain '@'.");
			return;
		}

		if (!password.trim()) {
			setMsg("Password cannot be empty.");
			return;
		}

		if (password !== confirmPassword) {
			setMsg("Passwords do not match.");
			return;
		}

		setMsg("");

		// Determine API base at runtime. If the app was built with VITE_API_URL pointing
		// to localhost but is running on a different host, prefer relative paths so
		// browser requests target the same origin as the page.
		const builtBase = import.meta.env.VITE_API_URL || "";
		const base =
			typeof window !== "undefined" &&
			window.location.hostname !== "localhost" &&
			builtBase.includes("localhost")
				? ""
				: builtBase || "";

		try {
			const res = await fetch(`${base}/api/auth/register`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email: trimmedEmail, password }),
			});

			let data;
			try {
				data = await res.json();
			} catch (_) {
				data = {};
			}

			if (!res.ok) {
				setMsg(data.message || `Register failed (${res.status})`);
			} else {
				// attempt to auto-login after successful registration
				try {
					const loginRes = await fetch(`${base}/api/auth/login`, {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({ username: trimmedEmail, password }),
					});
					const loginData = await loginRes.json();
					if (loginRes.ok && loginData.accessToken) {
						setToken?.(loginData.accessToken);
						localStorage.setItem("token", loginData.accessToken);
						setPage("tasks");
					} else {
						setMsg(data.message || "Registered! Please log in.");
					}
				} catch (err) {
					console.error("Auto-login failed", err);
					setMsg(data.message || "Registered! Please log in.");
				}
			}
		} catch (err) {
			console.error("Register error", err);
			setMsg(`Network error: ${err.message}`);
		}
	};

	return (
		<div className="auth-page">
			{onToggleNightMode && (
				<button
					type="button"
					className="theme-toggle"
					aria-label="Toggle night mode"
					onClick={onToggleNightMode}
				>
					{nightMode ? "🌞" : "🌙"}
				</button>
			)}
			<div className="auth-card">
				<h2>Register</h2>
				{msg && <p className="auth-error">{msg}</p>}
				<form onSubmit={handleRegister}>
					<input
						type="email"
						placeholder="Email"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						className="input"
					/>
					<br />
					<input
						type="password"
						placeholder="Password"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						className="input"
					/>
					<br />
					<input
						type="password"
						placeholder="Confirm password"
						value={confirmPassword}
						onChange={(e) => setConfirmPassword(e.target.value)}
						className="input"
					/>
					<br />
					<div style={{ display: "flex", gap: 8 }}>
						<button type="submit" className="btn btn-primary">
							Register
						</button>
						<button
							type="button"
							className="btn"
							onClick={() => setPage("login")}
						>
							Login
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
