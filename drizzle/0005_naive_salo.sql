ALTER TABLE `matches` MODIFY COLUMN `status` varchar(50) NOT NULL DEFAULT 'not_started';--> statement-breakpoint
ALTER TABLE `matches` MODIFY COLUMN `team1_id` int NOT NULL;--> statement-breakpoint
ALTER TABLE `matches` MODIFY COLUMN `team2_id` int NOT NULL;--> statement-breakpoint
ALTER TABLE `matches` ADD `start_time` datetime NOT NULL;--> statement-breakpoint
ALTER TABLE `matches` ADD `odds_team1` decimal(5,2) DEFAULT 1.00 NOT NULL;--> statement-breakpoint
ALTER TABLE `matches` ADD `odds_team2` decimal(5,2) DEFAULT 1.00 NOT NULL;--> statement-breakpoint
ALTER TABLE `matches` ADD `odds_updated_at` datetime DEFAULT CURRENT_TIMESTAMP NOT NULL;--> statement-breakpoint
ALTER TABLE `matches` DROP COLUMN `name`;--> statement-breakpoint
ALTER TABLE `matches` DROP COLUMN `begin_at`;--> statement-breakpoint
ALTER TABLE `matches` DROP COLUMN `league_name`;--> statement-breakpoint
ALTER TABLE `matches` DROP COLUMN `stream_url`;