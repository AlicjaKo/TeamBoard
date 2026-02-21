import { useCallback, useEffect, useState } from "react";
import { FiPlus } from "react-icons/fi";
import {
	fetchTasks,
	removeTask as removeSoloTask,
	updateTask as updateSoloTask,
} from "../api/tasks";
import {
	fetchTeamTasks,
	removeTask as removeTeamTask,
	updateTask as updateTeamTask,
} from "../api/teams";
import TaskItem from "./TaskItem";

export default function TaskList({ teamId, token, onAddTask }) {
	const [tasks, setTasks] = useState([]);
	const [loading, setLoading] = useState(true);

	const load = useCallback(async () => {
		try {
			setLoading(true);
			let data;
			if (teamId) {
				data = await fetchTeamTasks(teamId);
			} else {
				data = await fetchTasks();
			}
			setTasks(data);
		} catch (e) {
			console.error(e);
		} finally {
			setLoading(false);
		}
	}, [teamId]);

	useEffect(() => {
		// reference token so linter knows we depend on it (trigger reload after login/logout)
		const _t = token;
		void _t;
		load();
	}, [load, token]);

	const handleUpdate = async (id, updates) => {
		let updated;
		if (teamId) {
			updated = await updateTeamTask(teamId, id, updates);
		} else {
			updated = await updateSoloTask(id, updates);
		}

		// If the update moved ownership to another user, remove it from this user's list
		const getCurrentUserId = () => {
			try {
				const token = localStorage.getItem("token");
				if (!token) return null;
				const payload = JSON.parse(
					atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")),
				);
				return payload?.userId ?? null;
			} catch (_e) {
				return null;
			}
		};

		const currentUserId = getCurrentUserId();
		// Only remove from current list if this is the personal view (not a team board)
		if (
			!teamId &&
			updated &&
			currentUserId != null &&
			Number(updated.userId) !== Number(currentUserId)
		) {
			// Task transferred to someone else — remove from current (personal) list
			setTasks((t) => t.filter((x) => x.id !== updated.id));
		} else if (updated) {
			setTasks((t) => t.map((x) => (x.id === updated.id ? updated : x)));
		}
	};

	const handleDelete = async (id) => {
		// optimistic UI: remove task locally first
		const prev = tasks;
		setTasks((t) => t.filter((x) => x.id !== id));
		try {
			if (teamId) {
				await removeTeamTask(teamId, id);
			} else {
				await removeSoloTask(id);
			}
		} catch (e) {
			console.error("Failed to delete task, reloading list", e);
			// restore previous state or reload from server
			try {
				const data = teamId ? await fetchTeamTasks(teamId) : await fetchTasks();
				setTasks(data);
			} catch (_err) {
				// fallback: restore previous tasks if fetch fails
				setTasks(prev);
			}
		}
	};

	if (loading) return <div>Loading tasks…</div>;

	// Group tasks by priority (high, medium, low)
	const groups = { high: [], medium: [], low: [] };
	tasks.forEach((t) => {
		const p = (t.priority || t.importance || "medium").toLowerCase();
		if (groups[p]) groups[p].push(t);
		else groups.medium.push(t);
	});

	return (
		<div className="tasks-columns">
			<div className="task-column column-high">
				<div className="column-title-row">
					<h3 className="column-title">High</h3>
					<button
						type="button"
						className="btn btn-primary column-add-btn"
						onClick={() => onAddTask?.({ priority: "high" })}
						aria-label="Add high priority task"
						title="Add high priority task"
					>
						<FiPlus aria-hidden="true" />
					</button>
				</div>
				<div className="column-body">
					{groups.high.length === 0 && (
						<div className="empty-column">No high priority tasks</div>
					)}
					{groups.high.map((task) => (
						<TaskItem
							key={task.id}
							task={task}
							onUpdate={handleUpdate}
							onDelete={handleDelete}
							isPersonalView={!teamId}
						/>
					))}
				</div>
			</div>

			<div className="task-column column-medium">
				<div className="column-title-row">
					<h3 className="column-title">Medium</h3>
					<button
						type="button"
						className="btn btn-primary column-add-btn"
						onClick={() => onAddTask?.({ priority: "medium" })}
						aria-label="Add medium priority task"
						title="Add medium priority task"
					>
						<FiPlus aria-hidden="true" />
					</button>
				</div>
				<div className="column-body">
					{groups.medium.length === 0 && (
						<div className="empty-column">No medium priority tasks</div>
					)}
					{groups.medium.map((task) => (
						<TaskItem
							key={task.id}
							task={task}
							onUpdate={handleUpdate}
							onDelete={handleDelete}
							isPersonalView={!teamId}
						/>
					))}
				</div>
			</div>

			<div className="task-column column-low">
				<div className="column-title-row">
					<h3 className="column-title">Low</h3>
					<button
						type="button"
						className="btn btn-primary column-add-btn"
						onClick={() => onAddTask?.({ priority: "low" })}
						aria-label="Add low priority task"
						title="Add low priority task"
					>
						<FiPlus aria-hidden="true" />
					</button>
				</div>
				<div className="column-body">
					{groups.low.length === 0 && (
						<div className="empty-column">No low priority tasks</div>
					)}
					{groups.low.map((task) => (
						<TaskItem
							key={task.id}
							task={task}
							onUpdate={handleUpdate}
							onDelete={handleDelete}
							isPersonalView={!teamId}
						/>
					))}
				</div>
			</div>
		</div>
	);
}
