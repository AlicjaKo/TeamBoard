import { useEffect, useMemo, useState } from "react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { fetchTasks, removeTask, updateTask } from "../api/tasks";
import TaskItem from "./TaskItem";

const monthNames = [
	"January",
	"February",
	"March",
	"April",
	"May",
	"June",
	"July",
	"August",
	"September",
	"October",
	"November",
	"December",
];

function getMonthMatrix(year, month) {
	// month: 0-11
	const first = new Date(year, month, 1);
	const last = new Date(year, month + 1, 0);
	const matrix = [];
	const startDay = first.getDay(); // 0 (Sun) - 6
	let week = new Array(7).fill(null);
	// fill leading blanks
	for (let i = 0; i < startDay; i++) week[i] = null;
	let day = 1;
	for (let i = startDay; i < 7; i++) {
		week[i] = day++;
	}
	matrix.push(week);
	while (day <= last.getDate()) {
		week = new Array(7).fill(null);
		for (let i = 0; i < 7 && day <= last.getDate(); i++) {
			week[i] = day++;
		}
		matrix.push(week);
	}
	return matrix;
}

export default function CalendarView({ onAddTaskForDate }) {
	const today = new Date();
	const [display, setDisplay] = useState({
		year: today.getFullYear(),
		month: today.getMonth(),
	});

	const [selectedDate, setSelectedDate] = useState(new Date());
	const [tasks, setTasks] = useState([]);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		let cancelled = false;
		const load = async () => {
			setLoading(true);
			try {
				const data = await fetchTasks();
				if (!cancelled) setTasks(Array.isArray(data) ? data : []);
			} catch (e) {
				console.warn("Failed to load tasks", e);
			} finally {
				if (!cancelled) setLoading(false);
			}
		};

		load();
		return () => {
			cancelled = true;
		};
	}, []);

	const monthMatrix = useMemo(
		() => getMonthMatrix(display.year, display.month),
		[display.year, display.month],
	);

	const handlePrev = () => {
		setDisplay((d) => {
			const m = d.month - 1;
			if (m < 0) return { year: d.year - 1, month: 11 };
			return { year: d.year, month: m };
		});
	};
	const handleNext = () => {
		setDisplay((d) => {
			const m = d.month + 1;
			if (m > 11) return { year: d.year + 1, month: 0 };
			return { year: d.year, month: m };
		});
	};

	const onSelectDay = (day) => {
		if (!day) return;
		setSelectedDate(new Date(display.year, display.month, day));
	};

	const handleUpdate = async (id, updates) => {
		const updated = await updateTask(id, updates);
		if (updated) {
			setTasks((prev) =>
				prev.map((task) => (task.id === updated.id ? updated : task)),
			);
		}
	};

	const handleDelete = async (id) => {
		const previous = tasks;
		setTasks((prev) => prev.filter((task) => task.id !== id));
		try {
			await removeTask(id);
		} catch (e) {
			console.error("Failed to delete task in calendar view, reloading", e);
			try {
				const data = await fetchTasks();
				setTasks(Array.isArray(data) ? data : []);
			} catch (_err) {
				setTasks(previous);
			}
		}
	};

	// helper: group tasks by yyyy-mm-dd
	const tasksByDate = useMemo(() => {
		const map = new Map();
		for (const t of tasks) {
			if (!t.dueDate) continue;
			const d = new Date(t.dueDate);
			const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
			if (!map.has(key)) map.set(key, []);
			map.get(key).push(t);
		}
		return map;
	}, [tasks]);

	const formatKey = (year, month, day) =>
		`${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

	return (
		<section className="calendar-page">
			<div className="calendar-left">
				<div className="calendar-header">
					<button
						type="button"
						className="icon-btn"
						aria-label="Previous month"
						onClick={handlePrev}
					>
						<FiChevronLeft />
					</button>
					<button type="button" className="btn month-btn" aria-current="date">
						{monthNames[display.month]} {display.year}
					</button>
					<button
						type="button"
						className="icon-btn"
						aria-label="Next month"
						onClick={handleNext}
					>
						<FiChevronRight />
					</button>
				</div>

				<table className="calendar-table" aria-label="Calendar">
					<thead>
						<tr>
							<th>Sun</th>
							<th>Mon</th>
							<th>Tue</th>
							<th>Wed</th>
							<th>Thu</th>
							<th>Fri</th>
							<th>Sat</th>
						</tr>
					</thead>
					<tbody>
						{monthMatrix.map((week, wi) => (
							<tr key={`${display.year}-${display.month}-week-${wi}`}>
								{week.map((d, i) => {
									const isDay = Boolean(d);
									const isSelected =
										isDay &&
										selectedDate.getDate() === d &&
										selectedDate.getMonth() === display.month &&
										selectedDate.getFullYear() === display.year;
									const key = isDay
										? formatKey(display.year, display.month, d)
										: null;
									const cellTasks = key ? tasksByDate.get(key) || [] : [];
									return (
										<td
											key={`${display.year}-${display.month}-${wi}-${i}`}
											className={isDay ? "day-cell" : "empty-cell"}
											onClick={isDay ? () => onSelectDay(d) : undefined}
											role={isDay ? "button" : undefined}
											tabIndex={isDay ? 0 : undefined}
											onKeyDown={
												isDay
													? (e) => {
															if (e.key === "Enter" || e.key === " ") {
																e.preventDefault();
																onSelectDay(d);
															}
														}
													: undefined
											}
										>
											{isDay ? (
												<>
													<button
														type="button"
														className={
															"day-btn " + (isSelected ? "selected" : "")
														}
														onClick={(e) => {
															e.stopPropagation();
															onSelectDay(d);
														}}
													>
														{d}
													</button>
													<div className="cell-tasks">
														{cellTasks.slice(0, 3).map((t) => (
															<div
																key={t.id}
																className="cell-task-title"
																title={t.title}
															>
																{t.title}
															</div>
														))}
													</div>
												</>
											) : (
												""
											)}
										</td>
									);
								})}
							</tr>
						))}
					</tbody>
				</table>
			</div>

			<aside className="calendar-right">
				<section className="day-box" aria-label="Day details">
					<h3 className="day-box-title">{selectedDate.toDateString()}</h3>
					<div className="day-box-body">
						{loading ? (
							<p className="muted">Loading tasks…</p>
						) : (
							<>
								{(() => {
									const key = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, "0")}-${String(selectedDate.getDate()).padStart(2, "0")}`;
									const list = tasksByDate.get(key) || [];
									if (list.length === 0)
										return <p className="muted">No tasks for this day.</p>;
									return (
										<div className="task-cards">
											{list.map((t) => (
												<TaskItem
													key={t.id}
													task={t}
													onUpdate={handleUpdate}
													onDelete={handleDelete}
													isPersonalView
												/>
											))}
										</div>
									);
								})()}
							</>
						)}
						<button
							type="button"
							className="btn btn-primary day-box-add-btn"
							onClick={() => {
								const key = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, "0")}-${String(selectedDate.getDate()).padStart(2, "0")}`;
								onAddTaskForDate?.(key);
							}}
							aria-label="Add task for selected date"
							title="Add task for selected date"
						>
							Add task for this date
						</button>
					</div>
				</section>
			</aside>
		</section>
	);
}
