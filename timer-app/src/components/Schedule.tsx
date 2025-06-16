import React, { useState, useEffect } from "react";

// --- CONFIGURATION FOR A NEW, RELIABLE SERVICE (SUPABASE) ---
// You will get these from your own free Supabase project in the steps below.
const SUPABASE_URL = "https://ozkkpqyfnvvgppebybvn.supabase.co";
const SUPABASE_ANON_KEY =
	"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im96a2twcXlmbnZ2Z3BwZWJ5YnZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxMDgyNDYsImV4cCI6MjA2NTY4NDI0Nn0.tQ2MXClFDs8tRTIjKJU1-M7mLaDplwAiswb1Kapqvm4";

interface ScheduleItem {
	id: string;
	text: string;
}

const Schedule: React.FC = () => {
	const getInitialSchedule = (): ScheduleItem[] => {
		const storedSchedule = localStorage.getItem("dailySchedule");
		try {
			return storedSchedule
				? JSON.parse(storedSchedule)
				: [
						{ id: "1", text: "08:00-11:30 数学模拟考" },
						{ id: "2", text: "15:00-15:30 英语听力训练" },
						{ id: "3", text: "19:00-21:00 理综真题练习" },
				  ];
		} catch (e) {
			console.error("Error parsing stored schedule:", e);
			return [];
		}
	};

	const [scheduleItems, setScheduleItems] =
		useState<ScheduleItem[]>(getInitialSchedule);
	const [isEditing, setIsEditing] = useState(false);
	const [editText, setEditText] = useState("");

	const [showSyncPrompt, setShowSyncPrompt] = useState(false);
	const [syncCode, setSyncCode] = useState("");
	const [syncMessage, setSyncMessage] = useState("");

	useEffect(() => {
		localStorage.setItem("dailySchedule", JSON.stringify(scheduleItems));
	}, [scheduleItems]);

	const handleEditClick = () => {
		setEditText(scheduleItems.map((item) => item.text).join("\n"));
		setIsEditing(true);
	};

	const handleSaveEdit = () => {
		const newItems = editText
			.split("\n")
			.filter((line) => line.trim() !== "")
			.map((text, index) => ({
				id: Date.now().toString() + index,
				text: text.trim(),
			}));
		setScheduleItems(newItems);
		setIsEditing(false);
	};

	const handleCancelEdit = () => {
		setIsEditing(false);
	};

	// --- UPDATED SYNC FUNCTIONS FOR SUPABASE ---

	const handleUpload = async () => {
		if (!syncCode) {
			setSyncMessage("Please enter a sync code.");
			return;
		}
		if (SUPABASE_URL.includes("YOUR_SUPABASE_URL")) {
			setSyncMessage(
				"Error: Please configure Supabase variables in the code."
			);
			return;
		}
		setSyncMessage("Uploading...");
		try {
			const response = await fetch(`${SUPABASE_URL}/rest/v1/schedules`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					apikey: SUPABASE_ANON_KEY,
					Prefer: "resolution=merge-duplicates", // This will update the record if the syncCode already exists
				},
				body: JSON.stringify({
					id: syncCode, // The sync code is the ID in our database
					content: scheduleItems, // The schedule is the content
				}),
			});

			if (!response.ok) {
				const error = await response.json();
				console.error("Supabase error:", error);
				throw new Error("Failed to upload.");
			}
			setSyncMessage("Schedule uploaded successfully!");
		} catch (error) {
			console.error(error);
			setSyncMessage("Error: Could not upload schedule.");
		}
	};

	const handleDownload = async () => {
		if (!syncCode) {
			setSyncMessage("Please enter a sync code.");
			return;
		}
		if (SUPABASE_URL.includes("YOUR_SUPABASE_URL")) {
			setSyncMessage(
				"Error: Please configure Supabase variables in the code."
			);
			return;
		}
		setSyncMessage("Downloading...");
		try {
			const response = await fetch(
				`${SUPABASE_URL}/rest/v1/schedules?id=eq.${syncCode}&select=content`,
				{
					headers: {
						apikey: SUPABASE_ANON_KEY,
						Accept: "application/json",
					},
				}
			);
			if (!response.ok) throw new Error("Failed to download.");

			const data = await response.json();
			if (!data || data.length === 0) throw new Error("Code not found.");

			setScheduleItems(data[0].content); // The schedule is inside the 'content' field
			setSyncMessage("Schedule downloaded successfully!");
			setTimeout(() => setShowSyncPrompt(false), 1000);
		} catch (error) {
			console.error(error);
			setSyncMessage("Error: Could not find schedule with that code.");
		}
	};

	const openSyncPrompt = () => {
		setSyncMessage("");
		setShowSyncPrompt(true);
	};

	return (
		<div className="glass-panel schedule-panel">
			<div className="panel-title">今日安排</div>
			{showSyncPrompt && (
				<div className="schedule-edit-mode">
					<p
						style={{
							marginTop: 0,
							marginBottom: "8px",
							textAlign: "center",
						}}
					>
						Enter a code to sync your schedule.
					</p>
					<input
						type="text"
						value={syncCode}
						onChange={(e) => setSyncCode(e.target.value)}
						className="schedule-input"
						placeholder="Enter your secret sync code"
						style={{ marginBottom: "10px" }}
					/>
					<div className="schedule-edit-buttons">
						<button onClick={handleUpload} className="save-button">
							Upload
						</button>
						<button
							onClick={handleDownload}
							className="add-event-button"
						>
							Download
						</button>
					</div>
					<div
						style={{
							textAlign: "center",
							marginTop: "10px",
							minHeight: "20px",
						}}
					>
						{syncMessage}
					</div>
					<button
						onClick={() => setShowSyncPrompt(false)}
						className="cancel-button"
						style={{ width: "100%", marginTop: "5px" }}
					>
						Close
					</button>
				</div>
			)}
			{!isEditing && !showSyncPrompt && (
				<>
					<ul className="schedule-list">
						{scheduleItems.map((item) => (
							<li key={item.id} className="schedule-item">
								<span className="schedule-text">
									{item.text}
								</span>
							</li>
						))}
					</ul>
					<div className="schedule-buttons">
						<button
							onClick={openSyncPrompt}
							className="edit-button"
							title="Sync Schedule"
						>
							<svg
								viewBox="0 0 24 24"
								width="20"
								height="20"
								fill="currentColor"
							>
								<path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" />
							</svg>
						</button>
						<button
							onClick={handleEditClick}
							className="edit-button"
							title="Edit Schedule"
						>
							<svg
								viewBox="0 0 24 24"
								width="20"
								height="20"
								fill="currentColor"
							>
								<path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0-0.59,0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z" />
							</svg>
						</button>
					</div>
				</>
			)}
			{isEditing && (
				<div className="schedule-edit-mode">
					<textarea
						value={editText}
						onChange={(e) => setEditText(e.target.value)}
						className="schedule-textarea"
						placeholder="每行输入一个日程"
					/>
					<div className="schedule-edit-buttons">
						<button
							onClick={handleSaveEdit}
							className="save-button"
						>
							保存
						</button>
						<button
							onClick={handleCancelEdit}
							className="cancel-button"
						>
							取消
						</button>
					</div>
				</div>
			)}
		</div>
	);
};

export default Schedule;
