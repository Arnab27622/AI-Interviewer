import librosa
import re
import logging

logger = logging.getLogger(__name__)


class SpeechAnalysisService:
    FILLER_WORDS = [r"\buh\b", r"\bum\b", r"\bhmm\b", r"\buhh\b", r"\bumm\b"]

    @staticmethod
    def analyze_audio(file_path: str, transcript: str):
        """
        Analyzes an audio file to extract speech metrics: pace, pauses, and filler words.
        """
        try:
            # Load audio using librosa without resampling for much faster load times
            y, sr = librosa.load(file_path, sr=None)

            # Calculate duration in minutes
            duration_sec = librosa.get_duration(y=y, sr=sr)
            duration_min = duration_sec / 60.0

            # Find non-silent intervals to calculate pauses
            # top_db is the threshold (in decibels) below reference to consider as silence
            non_silent_intervals = librosa.effects.split(y, top_db=30)

            # Calculate total speaking time and total pause time
            speaking_time_sec = 0
            for interval in non_silent_intervals:
                speaking_time_sec += (interval[1] - interval[0]) / sr

            pause_time_sec = duration_sec - speaking_time_sec

            # Count pauses (number of gaps between non-silent intervals)
            pause_count = (
                len(non_silent_intervals) - 1 if len(non_silent_intervals) > 1 else 0
            )

            # Calculate word count from transcript
            words = re.findall(r"\b\w+\b", transcript)
            word_count = len(words)

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
