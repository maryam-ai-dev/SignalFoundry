"""Discord connector — reads messages from public channels via official bot API.

Safe: official API with clear permission model. Only reads public channels
the bot has been invited to. Requires DISCORD_BOT_TOKEN in env.
"""

import asyncio
import logging
import os
from datetime import datetime, timedelta, timezone

from app.connectors.base_connector import BaseConnector

logger = logging.getLogger(__name__)

_BOT_TOKEN = os.getenv("DISCORD_BOT_TOKEN", "")


class DiscordReader(BaseConnector):

    def search_posts(self, query: str, window_days: int = 7, limit: int = 25) -> list[dict]:
        # Discord doesn't support search without a bot — use fetch_messages with channel IDs
        return []

    def fetch_comments(self, post_id: str, limit: int = 50) -> list[dict]:
        return []

    def fetch_messages(self, channel_id: str, window_days: int = 7, limit: int = 100) -> list[dict]:
        if not _BOT_TOKEN:
            logger.warning("DISCORD_BOT_TOKEN not set — returning []")
            return []

        try:
            return _run_async(self._fetch_messages_async(channel_id, window_days, limit))
        except Exception as e:
            logger.warning("Discord fetch error: %s", e)
            return []

    def fetch_thread_messages(self, thread_id: str, limit: int = 50) -> list[dict]:
        if not _BOT_TOKEN:
            return []
        try:
            return _run_async(self._fetch_thread_async(thread_id, limit))
        except Exception as e:
            logger.warning("Discord thread error: %s", e)
            return []

    async def _fetch_messages_async(self, channel_id: str, window_days: int, limit: int) -> list[dict]:
        import discord

        intents = discord.Intents.default()
        intents.message_content = True
        client = discord.Client(intents=intents)

        results = []
        after = datetime.now(tz=timezone.utc) - timedelta(days=window_days)

        @client.event
        async def on_ready():
            try:
                channel = client.get_channel(int(channel_id))
                if channel is None:
                    channel = await client.fetch_channel(int(channel_id))

                async for msg in channel.history(limit=limit, after=after):
                    if msg.author.bot:
                        continue
                    reaction_count = sum(r.count for r in msg.reactions) if msg.reactions else 0
                    results.append({
                        "source_platform": "discord",
                        "source_post_id": str(msg.id),
                        "title": "",
                        "body": msg.content,
                        "author": msg.author.display_name,
                        "url": msg.jump_url,
                        "subreddit": "",
                        "score": reaction_count,
                        "comment_count": msg.thread.member_count if msg.thread else 0,
                        "created_utc": msg.created_at.isoformat(),
                        "fetched_at": datetime.now(tz=timezone.utc).isoformat(),
                    })
            except discord.Forbidden:
                logger.warning("No access to Discord channel %s", channel_id)
            except Exception as e:
                logger.warning("Discord channel %s error: %s", channel_id, e)
            finally:
                await client.close()

        await client.start(_BOT_TOKEN)
        logger.info("Discord returned %d messages from channel %s", len(results), channel_id)
        return results

    async def _fetch_thread_async(self, thread_id: str, limit: int) -> list[dict]:
        import discord

        intents = discord.Intents.default()
        intents.message_content = True
        client = discord.Client(intents=intents)

        results = []

        @client.event
        async def on_ready():
            try:
                thread = await client.fetch_channel(int(thread_id))
                async for msg in thread.history(limit=limit):
                    if msg.author.bot:
                        continue
                    results.append({
                        "source_platform": "discord",
                        "source_comment_id": str(msg.id),
                        "post_source_id": thread_id,
                        "author": msg.author.display_name,
                        "body": msg.content,
                        "score": sum(r.count for r in msg.reactions) if msg.reactions else 0,
                        "depth": 0,
                        "created_utc": msg.created_at.isoformat(),
                        "fetched_at": datetime.now(tz=timezone.utc).isoformat(),
                    })
            except Exception as e:
                logger.warning("Discord thread %s error: %s", thread_id, e)
            finally:
                await client.close()

        await client.start(_BOT_TOKEN)
        return results


def _run_async(coro):
    """Run async coroutine from sync context (Celery worker compatible)."""
    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            new_loop = asyncio.new_event_loop()
            try:
                return new_loop.run_until_complete(coro)
            finally:
                new_loop.close()
        return loop.run_until_complete(coro)
    except RuntimeError:
        loop = asyncio.new_event_loop()
        try:
            return loop.run_until_complete(coro)
        finally:
            loop.close()
