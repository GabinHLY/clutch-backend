CREATE TABLE `sessions` (
  `id` serial AUTO_INCREMENT NOT NULL,
  `user_id` INT NOT NULL,
  `session_token` varchar(255) NOT NULL,
  `expires_at` datetime NOT NULL,
  CONSTRAINT `sessions_id` PRIMARY KEY(`id`),
  CONSTRAINT `sessions_session_token_unique` UNIQUE(`session_token`)
);


--> statement-breakpoint
CREATE TABLE `users` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`email` varchar(255) NOT NULL,
	`password` varchar(255) NOT NULL,
	`created_at` datetime DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_email_unique` UNIQUE(`email`)
);
