ALTER TABLE `matches` ADD `stream_link` varchar(1000) DEFAULT null;--> statement-breakpoint
ALTER TABLE `teams` ADD `rating` int DEFAULT 1500 NOT NULL;