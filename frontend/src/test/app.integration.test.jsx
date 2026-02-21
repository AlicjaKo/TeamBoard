// src/test/app.integration.test.jsx

import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock the api module so network calls don't go out
vi.mock("../api/tasks", () => ({
	fetchTasks: vi.fn(),
	createTask: vi.fn(),
	updateTask: vi.fn(),
	removeTask: vi.fn(),
}));

import App from "../App";
import { createTask, fetchTasks } from "../api/tasks";
import { FEATURE_FLAGS } from "../featureFlags";

describe("App integration", () => {
	beforeEach(() => {
		vi.resetAllMocks();
		window.localStorage.clear();
		// Mock fetch for login
		global.fetch = vi.fn((url, options) => {
			if (url.includes("/api/auth/login")) {
				return Promise.resolve({
					ok: true,
					status: 200,
					json: () => Promise.resolve({ accessToken: "mock-token" }),
				});
			}
			// fallback for other fetches
			return Promise.resolve({
				ok: true,
				status: 200,
				json: () => Promise.resolve({}),
			});
		});
	});

	it("should allow login and add a task", async () => {
		const newTask = {
			id: "1",
			title: "Buy milk",
			description: "2L",
			completed: false,
		};
		fetchTasks.mockResolvedValueOnce([]).mockResolvedValueOnce([newTask]);
		createTask.mockResolvedValueOnce(newTask);

		render(<App />);
		const user = userEvent.setup();

		// Simulate login
		await user.type(screen.getByPlaceholderText(/email/i), "testuser@test.com");
		await user.type(screen.getByPlaceholderText(/password/i), "testpass");
		await user.click(screen.getByRole("button", { name: /login/i }));

		// Should show header/navigation after login
		expect(
			await screen.findByRole("button", { name: /profile/i }),
		).toBeInTheDocument();
		// Should show the empty-column message for medium priority tasks
		expect(
			await screen.findByText(/No medium priority tasks/i),
		).toBeInTheDocument();

		// Theme toggle button presence depends on feature flag
		if (FEATURE_FLAGS.lightThemeToggle) {
			expect(
				screen.getByRole("button", { name: /toggle night mode/i }),
			).toBeInTheDocument();
		} else {
			expect(
				screen.queryByRole("button", { name: /toggle night mode/i }),
			).not.toBeInTheDocument();
		}

		// Add a task via the floating add button (aria-label="Add task")
		await user.click(screen.getByRole("button", { name: /add task/i }));
		// scope all form interactions to the dialog overlay to avoid ambiguous matches
		const dialog = await screen.findByRole("dialog");
		expect(
			within(dialog).getByRole("heading", { name: /add task/i }),
		).toBeInTheDocument();
		await user.type(within(dialog).getByLabelText(/title/i), newTask.title);
		await user.type(
			within(dialog).getByLabelText(/description/i),
			newTask.description,
		);
		await user.click(within(dialog).getByRole("button", { name: /add task/i }));

		expect(createTask).toHaveBeenCalledWith(
			expect.objectContaining({
				title: newTask.title,
				description: newTask.description,
				priority: "medium",
				dueDate: null,
			}),
		);
		expect(await screen.findByText(newTask.title)).toBeInTheDocument();
	});
});
