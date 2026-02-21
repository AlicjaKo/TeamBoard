// src/test/login.test.jsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../api/tasks", () => ({
	fetchTasks: vi.fn(),
	createTask: vi.fn(),
	updateTask: vi.fn(),
	removeTask: vi.fn(),
}));

import App from "../App";
import { fetchTasks } from "../api/tasks";

describe("Login flow", () => {
	beforeEach(() => {
		vi.resetAllMocks();
		window.localStorage.clear();
		global.fetch = vi.fn((url, options) => {
			if (url.includes("/api/auth/login")) {
				return Promise.resolve({
					ok: true,
					status: 200,
					json: () => Promise.resolve({ accessToken: "mock-token" }),
				});
			}
			return Promise.resolve({
				ok: true,
				status: 200,
				json: () => Promise.resolve({}),
			});
		});
		// Mock fetchTasks to return an empty array so TaskList doesn't crash
		fetchTasks.mockResolvedValue([]);
	});

	it("should allow login and show header", async () => {
		render(<App />);
		const user = userEvent.setup();
		await user.type(screen.getByPlaceholderText(/email/i), "testuser@test.com");
		await user.type(screen.getByPlaceholderText(/password/i), "testpass");
		await user.click(screen.getByRole("button", { name: /login/i }));
		// Header/profile button indicates the app has navigated to the main area
		expect(
			await screen.findByRole("button", { name: /profile/i }),
		).toBeInTheDocument();
		// Theme toggle button presence depends on feature flag
		const { FEATURE_FLAGS } = require("../featureFlags");
		if (FEATURE_FLAGS.lightThemeToggle) {
			expect(
				screen.getByRole("button", { name: /toggle night mode/i }),
			).toBeInTheDocument();
		} else {
			expect(
				screen.queryByRole("button", { name: /toggle night mode/i }),
			).not.toBeInTheDocument();
		}
	});
});
