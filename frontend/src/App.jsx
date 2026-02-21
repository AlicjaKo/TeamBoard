import { useEffect, useRef, useState } from "react";
import CalendarView from "./components/CalendarView";
import Header from "./components/Header";
import Login from "./components/Login";
import Register from "./components/Register";
import TaskForm from "./components/TaskForm";
import TaskList from "./components/TaskList";
import TeamSettings from "./components/TeamSettings";
import UserSettings from "./components/UserSettings";
import { FEATURE_FLAGS } from "./featureFlags";
import "./App.css";
import { FiPlus, FiSettings } from "react-icons/fi";

function App() {
	const [token, setToken] = useState(
		() => localStorage.getItem("token") || null,
	);

	// track previous token so we can detect a fresh login (null -> token)
	const prevTokenRef = useRef(token);

	useEffect(() => {
		if (!prevTokenRef.current && token) {
			// fresh login: always show personal board first
			setTeamId(null);
			setTeamName("My tasks");
			setPage("tasks");
		}
		prevTokenRef.current = token;
	}, [token]);
	const [page, setPage] = useState(token ? "tasks" : "login");
	const [teamId, setTeamId] = useState(null);
	const [teamName, setTeamName] = useState("My tasks");
	const [refreshKey, setRefreshKey] = useState(0);
	const [nightMode, setNightMode] = useState(() => {
		try {
			return localStorage.getItem("theme") === "dark";
		} catch (_e) {
			return false;
		}
	});
	const [showAddForm, setShowAddForm] = useState(false);
	const [taskDefaults, setTaskDefaults] = useState({});

	const openAddTaskForm = (defaults = {}) => {
		setTaskDefaults(defaults);
		setShowAddForm(true);
	};

	// lock body scroll while overlay is open
	useEffect(() => {
		if (showAddForm) document.body.style.overflow = "hidden";
		else document.body.style.overflow = "";
		return () => {
			document.body.style.overflow = "";
		};
	}, [showAddForm]);

	// close overlay on Escape for keyboard users
	useEffect(() => {
		if (!showAddForm) return;
		const onKey = (e) => {
			if (e.key === "Escape") setShowAddForm(false);
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [showAddForm]);

	useEffect(() => {
		if (!FEATURE_FLAGS.lightThemeToggle) return;
		try {
			localStorage.setItem("theme", nightMode ? "dark" : "light");
		} catch (_e) {
			/* Ignore storage errors (e.g. private mode) */
		}
		if (nightMode) document.documentElement.classList.remove("theme-light");
		else document.documentElement.classList.add("theme-light");
	}, [nightMode]);

	// User Auth login and register
	const handleLogout = () => {
		setToken(null);
		localStorage.removeItem("token");
		setPage("login");
	};

	const toggleNight = FEATURE_FLAGS.lightThemeToggle
		? () => setNightMode((v) => !v)
		: undefined;

	if (page === "login")
		return (
			<Login
				setToken={setToken}
				setPage={setPage}
				onToggleNightMode={toggleNight}
				nightMode={nightMode}
			/>
		);
	if (page === "register")
		return (
			<Register
				setPage={setPage}
				setToken={setToken}
				onToggleNightMode={toggleNight}
				nightMode={nightMode}
			/>
		);

	const navigate = (p, id, name) => {
		if (p === "tasks") {
			if (id) {
				setTeamId(id);
				if (name) setTeamName(name);
			} else {
				// navigate back to personal "My tasks" board
				setTeamId(null);
				setTeamName("My tasks");
			}
			setPage("tasks");
			return;
		}
		setPage(p);
	};

	return (
		<div className="app">
			<Header
				onLogout={handleLogout}
				onToggleNightMode={
					FEATURE_FLAGS.lightThemeToggle
						? () => setNightMode((v) => !v)
						: undefined
				}
				nightMode={nightMode}
				teamName={teamName}
				teamId={teamId}
				currentPage={page}
				onNavigate={navigate}
				onAddTask={() => openAddTaskForm()}
			/>
			{/* show New Task form overlay */}
			{showAddForm && (
				<div className="overlay-form">
					{/* backdrop removed: overlay will remain until closed via Escape or explicit controls */}
					<div className="overlay-panel" role="dialog" aria-modal="true">
						<button
							type="button"
							className="modal-close"
							onClick={() => setShowAddForm(false)}
							aria-label="Close"
						>
							×
						</button>
						<h3 className="modal-title">Add Task</h3>
						<TaskForm
							teamId={teamId}
							initialPriority={taskDefaults.priority}
							initialDueDate={taskDefaults.dueDate}
							onCreated={() => {
								setRefreshKey((k) => k + 1);
								setShowAddForm(false);
								setTaskDefaults({});
							}}
							onClose={() => {
								setShowAddForm(false);
								setTaskDefaults({});
							}}
						/>
					</div>
				</div>
			)}
			<main className="main-content">
				<header className="page-header">
					{page === "user-settings" ? (
						<h1 className="page-title">User Settings</h1>
					) : (
						<h1 className="page-title">
							<button
								type="button"
								className="btn-plain page-title-btn"
								onClick={() => setPage("tasks")}
								title="Back to tasks"
							>
								{teamName}
							</button>
							{teamId && (
								<button
									type="button"
									className="icon-btn page-title-gear"
									onClick={() => setPage("team-settings")}
									aria-label="Open team settings"
									title="Settings"
								>
									<FiSettings />
								</button>
							)}
						</h1>
					)}
				</header>
				<div key={refreshKey}>
					{page === "tasks" && (
						<TaskList
							teamId={teamId}
							token={token}
							onAddTask={(defaults) => openAddTaskForm(defaults)}
						/>
					)}
					{page === "team-settings" && (
						<TeamSettings
							teamId={teamId}
							teamName={teamName}
							onChangeName={(name) => setTeamName(name)}
							onNavigate={navigate}
						/>
					)}
					{page === "calendar" && (
						<CalendarView
							onAddTaskForDate={(dueDate) => openAddTaskForm({ dueDate })}
						/>
					)}
					{page === "user-settings" && (
						<UserSettings onNavigate={(p) => setPage(p)} />
					)}
				</div>
				{/* floating circular add button (hide on settings page) */}
				{page === "tasks" && (
					<button
						type="button"
						className="floating-add"
						onClick={() => openAddTaskForm()}
						aria-label="Add task"
						title="New task"
					>
						<FiPlus />
					</button>
				)}
			</main>
		</div>
	);
}

export default App;
