import subprocess
import re
import logging

logger = logging.getLogger(__name__)


class SpeechAnalysisService:
    FILLER_WORDS = [r"\buh\b", r"\bum\b", r"\bhmm\b", r"\buhh\b", r"\bumm\b"]

    @staticmethod
    def analyze_audio(file_path: str, transcript: str):
        """
        Analyzes an audio file to extract speech metrics: pace, pauses, and filler words.
        Uses fast ffprobe heuristics to prevent server timeouts on cloud deployments.
        """
        try:
            # Fast duration extraction using ffprobe
            try:
                cmd = [
                    'ffprobe', '-v', 'error', '-show_entries', 'format=duration',
                    '-of', 'default=noprint_wrappers=1:nokey=1', file_path
                ]
                duration_sec = float(subprocess.check_output(cmd, stderr=subprocess.STDOUT).decode('utf-8').strip())
            except Exception as e:
                logger.warning(f"ffprobe failed ({e}), falling back to heuristic duration")
                # Fallback duration if ffprobe is missing
                words_temp = re.findall(r"\b\w+\b", transcript)
                duration_sec = (len(words_temp) / 130.0) * 60.0

            duration_min = duration_sec / 60.0

            # Calculate word count from transcript
            words = re.findall(r"\b\w+\b", transcript)
            word_count = len(words)

            # Fast heuristic for speaking time (avoids heavy librosa.effects.split)
            # Average speaking pace is ~130 WPM
            estimated_speaking_time = (word_count / 130.0) * 60.0
            speaking_time_sec = min(duration_sec, estimated_speaking_time)

            pause_time_sec = max(0, duration_sec - speaking_time_sec)

            # Estimate pause count: roughly 1 pause per 15 words if there is significant pause time
            pause_count = int(word_count / 15) if pause_time_sec > 2.0 else 0

            # Calculate pace (words per minute)
            pace_wpm = word_count / duration_min if duration_min > 0 else 0

            # Count filler words
            filler_count = 0
            transcript_lower = transcript.lower()
            for pattern in SpeechAnalysisService.FILLER_WORDS:
                filler_count += len(re.findall(pattern, transcript_lower))

            return {
                "duration_seconds": round(duration_sec, 2),
                "speaking_time_seconds": round(speaking_time_sec, 2),
                "pause_time_seconds": round(pause_time_sec, 2),
                "pause_count": pause_count,
                "word_count": word_count,
                "pace_wpm": round(pace_wpm, 2),
                "filler_words_count": filler_count,
            }
        except Exception as e:
            logger.error(f"Error in speech analysis: {e}")
            return {
                "error": str(e),
                "duration_seconds": 0,
                "speaking_time_seconds": 0,
                "pause_time_seconds": 0,
                "pause_count": 0,
                "word_count": len(re.findall(r"\b\w+\b", transcript)),
                "pace_wpm": 0,
                "filler_words_count": 0,
            }
