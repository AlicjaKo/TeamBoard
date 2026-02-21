import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { FiTrash2 } from "react-icons/fi";
import { fetchAllUsers, fetchTeamMembers } from "../api/teams";

export default function TaskItem({ task, onUpdate, onDelete, isPersonalView }) {
	const [editing, setEditing] = useState(false);
	const [editTitle, setEditTitle] = useState(task.title);
	const [editDescription, setEditDescription] = useState(task.description);
	const [editDueDate, setEditDueDate] = useState(
		task.dueDate ? task.dueDate.slice(0, 10) : "",
	);
	const [editPriority, setEditPriority] = useState(
		task.priority || task.importance || "medium",
	);
	const [saving, setSaving] = useState(false);

	const [availableUsers, setAvailableUsers] = useState([]);
	const [editAssignedUser, setEditAssignedUser] = useState(
		task.assignedUserId ?? null,
	);
	const [currentUserRole, setCurrentUserRole] = useState(null);
	const [forbiddenMessage, setForbiddenMessage] = useState(null);

	useEffect(() => {
		let mounted = true;
		async function loadUsers() {
			try {
				if (task.teamId) {
					const { users } = await fetchTeamMembers(task.teamId);
					if (!mounted) return;
					setAvailableUsers(users || []);
					// determine current user's role in this team
					try {
						const token = localStorage.getItem("token");
						if (token) {
							const payload = JSON.parse(
								atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")),
							);
							const uid = payload?.userId ?? null;
							const membership = (users || []).find(
								(u) => Number(u.userId) === Number(uid),
							);
							setCurrentUserRole(membership?.role ?? null);
						}
					} catch (_e) {
						setCurrentUserRole(null);
					}
				} else {
					const users = await fetchAllUsers();
					if (!mounted) return;
					setAvailableUsers(users || []);
				}
			} catch (e) {
				console.error("Failed to load users for task edit", e);
				setAvailableUsers([]);
			}
		}
		loadUsers();
		return () => {
			mounted = false;
		};
	}, [task.teamId]);

	useEffect(() => {
		if (!forbiddenMessage) return;
		const t = setTimeout(() => setForbiddenMessage(null), 3000);
		return () => clearTimeout(t);
	}, [forbiddenMessage]);

	const handleSave = async (e) => {
		e.preventDefault();
		if (!editTitle.trim()) return alert("Title required");
		try {
			setSaving(true);
			const updates = {
				title: editTitle,
				description: editDescription,
				dueDate: editDueDate || null,
				priority: editPriority,
			};
			if (editAssignedUser !== undefined) {
				updates.assignedUserId = editAssignedUser
					? Number(editAssignedUser)
					: null;
				const user = availableUsers.find(
					(u) => Number(u.userId ?? u.id) === Number(editAssignedUser),
				);
				updates.assignedUserName = user ? (user.username ?? user.name) : null;
			}
			try {
				await onUpdate(task.id, updates);
				setEditing(false);
			} catch (err) {
				console.error("Failed to save task edit", err);
				setForbiddenMessage(
					err?.message?.toLowerCase().includes("forbid")
						? "Only owner can do this action"
						: (err?.message ?? "Failed to save"),
				);
			}
		} finally {
			setSaving(false);
		}
	};

	const handleToggle = async () => {
		// toggling completion follows same owner rules for team tasks — delegate to parent and catch errors
		try {
			await onUpdate(task.id, { completed: !task.completed });
		} catch (err) {
			console.error("Failed to toggle completion", err);
			setForbiddenMessage(
				err?.message?.toLowerCase().includes("forbid")
					? "Only owner can do this action"
					: (err?.message ?? "Action failed"),
			);
		}
	};

	const attemptEdit = () => {
		if (task.teamId && currentUserRole !== "owner") {
			setForbiddenMessage("Only owner can do this action");
			return;
		}
		setEditing(true);
	};

	const attemptDelete = () => {
		if (task.teamId && currentUserRole !== "owner") {
			setForbiddenMessage("Only owner can do this action");
			return;
		}
		onDelete(task.id);
	};

	// Color mapping for priority
	const priorityColors = {
		high: "#e53935",
		medium: "#fbc02d",
		low: "#43a047",
	};

	return (
		<article className="task-card" style={{ position: "relative" }}>
			{editing ? (
				createPortal(
					<div className="overlay-form">
						<div className="overlay-panel" role="dialog" aria-modal="true">
							<button
								type="button"
								className="modal-close"
								onClick={() => setEditing(false)}
								aria-label="Close"
							>
								×
							</button>
							<h3 className="modal-title">Edit Task</h3>
							<form onSubmit={handleSave} className="task-form">
								<div
									style={{ display: "flex", flexDirection: "column", gap: 10 }}
								>
									<label>
										Title
										<input
											className="input"
											value={editTitle}
											onChange={(e) => setEditTitle(e.target.value)}
											placeholder="Title"
										/>
									</label>
									<label>
										Description
										<input
											className="input"
											value={editDescription}
											onChange={(e) => setEditDescription(e.target.value)}
											placeholder="Description"
										/>
									</label>
									<label>
										Date
										<input
											className="input"
											type="date"
											value={editDueDate}
											onChange={(e) => setEditDueDate(e.target.value)}
										/>
									</label>
									<label>
										Priority
										<select
											className="input"
											value={editPriority}
											onChange={(e) => setEditPriority(e.target.value)}
										>
											<option value="high">High</option>
											<option value="medium">Medium</option>
											<option value="low">Low</option>
										</select>
									</label>
									{task.teamId && (
										<label>
											Assign to
											<select
												className="input"
												value={editAssignedUser ?? ""}
												onChange={(e) =>
													setEditAssignedUser(e.target.value || null)
												}
											>
												<option value="">Unassigned</option>
												{availableUsers.map((u) => (
													<option
														key={u.userId ?? u.id}
														value={u.userId ?? u.id}
													>
														{u.username ?? u.name}
													</option>
												))}
											</select>
										</label>
									)}
								</div>
								<div className="form-actions" style={{ marginTop: 12 }}>
									<button
										className="btn btn-ghost"
										type="button"
										onClick={() => setEditing(false)}
									>
										Cancel
									</button>
									<button
										className="btn btn-primary"
										type="submit"
										disabled={saving}
									>
										{saving ? "Saving…" : "Save"}
									</button>
								</div>
							</form>
						</div>
					</div>,
					document.body,
				)
			) : (
				<>
					<div
						style={{
							display: "flex",
							justifyContent: "space-between",
							alignItems: "center",
							flexWrap: "wrap",
							rowGap: 6,
							columnGap: 8,
							marginBottom: 8,
						}}
					>
						<span
							className="task-priority"
							style={{
								color:
									priorityColors[task.priority || task.importance] || "#333",
							}}
						>
							Priority:{" "}
							{task.priority || task.importance
								? (task.priority || task.importance).charAt(0).toUpperCase() +
									(task.priority || task.importance).slice(1)
								: "Medium"}
						</span>
						<div
							style={{
								display: "flex",
								alignItems: "center",
								gap: 4,
								flexWrap: "wrap",
								justifyContent: "flex-end",
								maxWidth: "100%",
							}}
						>
							{task.dueDate && (
								<span
									className="task-due-date"
									style={{ fontSize: 13, overflowWrap: "anywhere" }}
								>
									Due: {new Date(task.dueDate).toLocaleDateString()}
								</span>
							)}
							{!editing && (
								<button
									type="button"
									className="btn btn-ghost icon-btn delete-btn"
									title="Delete"
									aria-label="Delete task"
									style={{ marginLeft: 2 }}
									onClick={attemptDelete}
								>
									<FiTrash2 />
								</button>
							)}
						</div>
					</div>
					{task.assignedUserName && (
						<div style={{ marginBottom: 8, fontSize: 13 }}>
							Assigned to: <strong>{task.assignedUserName}</strong>
						</div>
					)}
					{/* Show source team if available */}
					{(task.teamName || task.Team?.name) && (
						<div style={{ marginBottom: 8, fontSize: 13 }}>
							From team: <strong>{task.teamName || task.Team?.name}</strong>
						</div>
					)}
					<h3
						className={`task-title ${task.completed ? "task-completed" : ""}`}
					>
						{task.title}
					</h3>
					<p className="task-description">{task.description}</p>
					<div className="task-controls">
						<button
							type="button"
							className="btn btn-primary"
							onClick={handleToggle}
						>
							{task.completed ? "Undo" : "Complete"}
						</button>
						{/* Hide edit button in personal view for tasks that belong to a team; team tasks must be edited in the team board */}
						{(!isPersonalView || !task.teamId) && (
							<button type="button" className="btn" onClick={attemptEdit}>
								Edit
							</button>
						)}

						{forbiddenMessage && (
							<div style={{ color: "#b00020", marginTop: 8 }}>
								{forbiddenMessage}
							</div>
						)}
					</div>
				</>
			)}
		</article>
	);
}
