CREATE TABLE `matches` (
	`id` varchar(255) NOT NULL,
	`name` varchar(255) NOT NULL,
	`status` varchar(50),
	`begin_at` datetime,
	`league_name` varchar(255),
	`team1_id` int,
	`team2_id` int,
	CONSTRAINT `matches_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `players` (
	`id` int NOT NULL,
	`name` varchar(255),
	`age` int,
	`nationality` varchar(100),
	`image_url` varchar(1000),
	`team_id` int,
	CONSTRAINT `players_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `teams` (
	`id` int NOT NULL,
	`name` varchar(255),
	`acronym` varchar(50),
	`slug` varchar(255),
	`image_url` varchar(1000),
	CONSTRAINT `teams_id` PRIMARY KEY(`id`)
);
