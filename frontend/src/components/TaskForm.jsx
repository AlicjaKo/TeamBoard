import { useEffect, useId, useState } from "react";
import { createTask } from "../api/tasks";
import { createTeamTask, fetchTeamMembers } from "../api/teams";

export default function TaskForm({
	onCreated,
	onClose,
	teamId,
	initialPriority = "medium",
	initialDueDate = "",
}) {
	const id = useId();
	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [dueDate, setDueDate] = useState(initialDueDate || "");
	const [priority, setPriority] = useState(initialPriority || "medium");
	const [loading, setLoading] = useState(false);

	const [availableUsers, setAvailableUsers] = useState([]);
	// Only allow selecting assignee when creating a team task
	const [selectedAssignee, setSelectedAssignee] = useState(null);

	useEffect(() => {
		let mounted = true;
		async function loadMembers() {
			try {
				if (teamId) {
					const { users } = await fetchTeamMembers(teamId);
					if (!mounted) return;
					setAvailableUsers(users || []);
				} else {
					// personal board: do not expose assignable users when creating tasks
					setAvailableUsers([]);
					setSelectedAssignee(null);
				}
			} catch (e) {
				console.error("Failed to fetch users", e);
				setAvailableUsers([]);
			}
		}
		loadMembers();
		return () => {
			mounted = false;
		};
	}, [teamId]);

	useEffect(() => {
		setDueDate(initialDueDate || "");
	}, [initialDueDate]);

	useEffect(() => {
		setPriority(initialPriority || "medium");
	}, [initialPriority]);

	const submit = async (e) => {
		e.preventDefault();
		if (!title.trim()) return alert("Title required");
		try {
			setLoading(true);
			let newTask;
			if (teamId) {
				const assignedUserId = selectedAssignee
					? Number(selectedAssignee)
					: undefined;
				newTask = await createTeamTask({
					teamId,
					title,
					description,
					dueDate: dueDate || null,
					priority,
					assignedUserId,
				});
			} else {
				// personal board: creating a task is always created by the user and not assigned
				newTask = await createTask({
					title,
					description,
					dueDate: dueDate || null,
					priority,
				});
			}
			setTitle("");
			setDescription("");
			setDueDate(initialDueDate || "");
			setPriority(initialPriority || "medium");
			if (onCreated) onCreated(newTask);
		} catch (e) {
			console.error(e);
			alert("Failed to create task");
		} finally {
			setLoading(false);
		}
	};

	return (
		<form className="task-form" onSubmit={submit}>
			<div>
				<label>
					Title
					<input
						id={`title-${id}`}
						className="input"
						value={title}
						onChange={(e) => setTitle(e.target.value)}
						placeholder=""
					/>
				</label>
			</div>
			<div>
				<label>
					Description
					<input
						className="input"
						value={description}
						onChange={(e) => setDescription(e.target.value)}
						placeholder=""
					/>
				</label>
			</div>
			<div>
				<label>
					Date
					<input
						id={`date-${id}`}
						className="input"
						type="date"
						value={dueDate}
						onChange={(e) => setDueDate(e.target.value)}
						placeholder=""
					/>
				</label>
			</div>
			<div>
				<label htmlFor={`priority-${id}`}>
					Priority
					<select
						id={`priority-${id}`}
						className="input"
						value={priority}
						onChange={(e) => setPriority(e.target.value)}
					>
						<option value="high">High</option>
						<option value="medium">Medium</option>
						<option value="low">Low</option>
					</select>
				</label>
			</div>
			{/* Assign users: only when creating a task on a team board */}
			{teamId && (
				<div>
					<label htmlFor={`assign-${id}`}>Assign user</label>
					<select
						id={`assign-${id}`}
						className="input"
						value={selectedAssignee ?? ""}
						onChange={(e) => setSelectedAssignee(e.target.value || null)}
					>
						<option value="">Unassigned</option>
						{availableUsers.map((u) => (
							<option key={u.userId ?? u.id} value={u.userId ?? u.id}>
								{u.username ?? u.name}
							</option>
						))}
					</select>
				</div>
			)}
			<div className="form-actions">
				<button
					className="btn btn-ghost"
					type="button"
					onClick={() => onClose?.()}
				>
					Cancel
				</button>
				<button className="btn btn-primary" type="submit" disabled={loading}>
					{loading ? "Saving…" : "Add Task"}
				</button>
			</div>
		</form>
	);
}
