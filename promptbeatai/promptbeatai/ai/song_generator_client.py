from abc import ABC, abstractmethod

from promptbeatai.app.entities.generation_prompt import GenerationPrompt
from promptbeatai.loopmaker.core import Song


class SongGeneratorClient(ABC):
    @abstractmethod
    def request_song(self, prompt: GenerationPrompt) -> Song:
        """
        Generate a song based on the given prompt.

        Args:
            prompt (GenerationPrompt): The prompt to generate the song from.

        Returns:
            Song: The generated song.
        """
        raise NotImplementedError("Subclasses must implement this method.")
