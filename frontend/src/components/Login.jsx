import { useState } from "react";
import { FiMoon, FiSun } from "react-icons/fi";

export default function Login({
	setToken,
	setPage,
	onToggleNightMode,
	nightMode,
}) {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");

	const handleLogin = async (e) => {
		e.preventDefault();
		// Determine API base at runtime to avoid using a build-time localhost URL
		// when the app is deployed somewhere else.
		const builtBase = import.meta.env.VITE_API_URL || "";
		const base =
			typeof window !== "undefined" &&
			window.location.hostname !== "localhost" &&
			builtBase.includes("localhost")
				? ""
				: builtBase || "";

		try {
			const res = await fetch(`${base}/api/auth/login`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ username: email.trim(), password }),
			});

			let data;
			try {
				data = await res.json();
			} catch (_) {
				data = {};
			}

			if (res.ok && data.accessToken) {
				setToken(data.accessToken);
				localStorage.setItem("token", data.accessToken);
				setPage("tasks");
			} else {
				setError(data.message || `Login failed (${res.status})`);
			}
		} catch (err) {
			console.error("Login error", err);
			setError(`Network error: ${err.message}`);
		}
	};

	return (
		<div className="auth-page landing-auth-page">
			{onToggleNightMode && (
				<button
					type="button"
					className="theme-toggle icon-btn"
					aria-label="Toggle night mode"
					onClick={onToggleNightMode}
				>
					{nightMode ? <FiSun /> : <FiMoon />}
				</button>
			)}
			<div className="landing-shell">
				<section className="landing-info" aria-label="About TeamBoard">
					<span className="landing-badge">TeamBoard</span>
					<h1>Keep your team organized and focused.</h1>
					<p>
						TeamBoard gives you one clear place for personal and team tasks,
						priorities, and shared planning.
					</p>
					<ul className="landing-points">
						<li>Understand what needs to be done now and next.</li>
						<li>Collaborate in team spaces without losing personal focus.</li>
						<li>Use task and calendar views to stay on schedule.</li>
					</ul>
					<button
						type="button"
						className="btn btn-primary"
						onClick={() => setPage("register")}
					>
						Create account
					</button>
				</section>

				<div className="auth-card landing-auth-card">
					<h2>Welcome back</h2>
					<p className="auth-subtitle">Sign in to continue to your board.</p>
					{error && <p className="auth-error">{error}</p>}
					<form onSubmit={handleLogin}>
						<input
							type="email"
							placeholder="Email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							className="input"
						/>
						<input
							type="password"
							placeholder="Password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							className="input"
						/>
						<div className="form-actions">
							<button type="submit" className="btn btn-primary">
								Login
							</button>
							<button
								type="button"
								className="btn"
								onClick={() => setPage("register")}
							>
								Register
							</button>
						</div>
					</form>
				</div>
			</div>
		</div>
	);
}
