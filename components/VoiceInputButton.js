'use client'
import { useState, useEffect, useRef } from 'react'
import { useForm } from '../context/FormContext';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
const API_KEY = process.env.NEXT_PUBLIC_API_KEY;

export default function VoiceInputButton() {
  const [isThinking, setIsThinking] = useState(false)
  const [message, setMessage] = useState("Toque na tela para iniciar")
  const [dots, setDots] = useState("")
  const [isRecording, setIsRecording] = useState(false)
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])
  const [sessionId, setSessionId] = useState(null)
  const audioResponseRef = useRef(null)
  const [isLongText, setIsLongText] = useState(false)
  const [audioUrl, setAudioUrl] = useState('');
  const [audioStream, setAudioStream] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const thinkingAudioRef = useRef(null)

  const { currentStep, questions, handleNextQuestion } = useForm();

  // Get initial session
  useEffect(() => {
    const getSession = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/conversation/session`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Authorization': API_KEY
          }
        })
        
        if (!response.ok) {
          throw new Error('Failed to get session')
        }
        
        const data = await response.json()
        console.log('Session created:', data)
        setSessionId(data.sessionId)
      } catch (error) {
        console.error('Error getting session:', error)
        setMessage("Erro ao iniciar sessão. Recarregue a página.")
      }
    }
    getSession()
  }, [])

  // Handle dots animation
  useEffect(() => {
    if (!isThinking) return

    const dotsInterval = setInterval(() => {
      setDots(prev => {
        if (prev === "...") return ""
        return prev + "."
      })
    }, 500)

    return () => clearInterval(dotsInterval)
  }, [isThinking])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaRecorderRef.current = new MediaRecorder(stream)
      audioChunksRef.current = []

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data)
      }

      // Request data every 250ms to ensure we get the audio chunks
      mediaRecorderRef.current.start(250)
      setIsRecording(true)
      setMessage("Ouvindo...")
    } catch (error) {
      console.error('Error starting recording:', error)
      setMessage("Erro ao acessar microfone")
    }
  }

  const stopRecording = async () => {
    if (!mediaRecorderRef.current) return null

    return new Promise((resolve) => {
      mediaRecorderRef.current.onstop = async () => {
        if (audioChunksRef.current.length === 0) {
          console.error('No audio data recorded')
          resolve(null)
          return
        }
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' })
        resolve(audioBlob)
      }
      mediaRecorderRef.current.stop()
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop())
    })
  }

  const playAudioResponse = async (audioUrl) => {
    try {
      if (!audioResponseRef.current) {
        audioResponseRef.current = new window.Audio()
      }
      
      // Stop any currently playing audio
      audioResponseRef.current.pause()
      audioResponseRef.current.src = ''

      // Create and play new audio
      audioResponseRef.current.src = audioUrl
      audioResponseRef.current.playbackRate = 1.35
      await audioResponseRef.current.play()
    } catch (error) {
      console.error('Error playing audio:', error)
    }
  }

  const playThinkingMusic = () => {
    if (!thinkingAudioRef.current) {
      thinkingAudioRef.current = new Audio('/music.mp3')
      thinkingAudioRef.current.loop = true
      thinkingAudioRef.current.volume = 0.1
    }
    thinkingAudioRef.current.play()
  }

  const stopThinkingMusic = () => {
    if (thinkingAudioRef.current) {
      thinkingAudioRef.current.pause()
      thinkingAudioRef.current.currentTime = 0
    }
  }

  const handleAudioUpload = async (audioBlob) => {
    if (!sessionId) {
      setMessage("Erro: Sessão não iniciada")
      return
    }

    setIsThinking(true)
    setMessage("Pensando")
    playThinkingMusic()
    
    try {
      const formData = new FormData()
      formData.append('spaceId', '4')
      formData.append('stageId', questions[currentStep])
      formData.append('sessionId', String(sessionId))
      formData.append('audioFile', audioBlob, 'audio.wav')

      const response = await fetch(`${API_BASE_URL}/conversation/message`, {
        method: 'POST',
        headers: {
          'Authorization': API_KEY
        },
        body: formData
      })

      if (!response.ok) {
        throw new Error('Failed to upload audio')
      }

      const data = await response.json()
      stopThinkingMusic()
      setIsThinking(false)
      setMessage(data.transcription)

      textToSpeech(data.transcription)

      // Play the audio response if available
      if (data.audioUrl) {
        await playAudioResponse(data.audioUrl)
      }

      if (data.transcription) {
        handleNextQuestion(questions[currentStep + 1]);  // Atualiza a resposta no contexto
        setMessage(data.transcription);  // Exibe a próxima pergunta ou finaliza
      }

    } catch (error) {
      console.error('Error uploading audio:', error)
      stopThinkingMusic()
      setIsThinking(false)
      setMessage("Desculpe, não consegui entender. Poderia repetir?")
    }
  }

  // Cleanup audio on component unmount
  useEffect(() => {
    // Initialize audio on client side
    audioResponseRef.current = new window.Audio()
    
    // Cleanup on unmount
    return () => {
      if (audioResponseRef.current) {
        audioResponseRef.current.pause()
        audioResponseRef.current.src = ''
      }
      if (thinkingAudioRef.current) {
        thinkingAudioRef.current.pause()
        thinkingAudioRef.current.src = ''
      }
    }
  }, [])

  const stopAudioAndReset = () => {
    if (audioResponseRef.current) {
      audioResponseRef.current.pause()
      audioResponseRef.current.src = ''
    }
    setMessage("Toque na tela para iniciar")
    setIsThinking(false)
  }

  const handleClick = async (e) => {
    if (e) e.preventDefault()
    
    // Always stop any playing audio first
    if (audioResponseRef.current) {
      audioResponseRef.current.pause()
      audioResponseRef.current.src = ''
    }

    // If we're already recording, stop and process
    if (isRecording) {
      if (!mediaRecorderRef.current) return
      
      setIsRecording(false)
      mediaRecorderRef.current.stop()
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop())
      
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' })
      await handleAudioUpload(audioBlob)
      return
    }

    // Start new recording
    startRecording()
  }

  // Update isLongText whenever message changes
  useEffect(() => {
    setIsLongText(message.length > 50)
  }, [message])


  useEffect(() => {
    if (audioUrl && isPlaying) {
      audioResponseRef.current.play();
	    console.log(audioUrl, isPlaying, audioResponseRef.current)
    }
  }, [audioUrl, isPlaying]);

  const textToSpeech = async (ai_response_message) => {
    const formData = new FormData();
    formData.append('message', ai_response_message);
  
    try {
      const response = await fetch(`${API_BASE_URL}/speak`, {
        method: 'POST',
        headers: {
          'Authorization': API_KEY
        },
        body: formData,
      });
  
      if (response.ok) {
        const audioBlob = await response.blob();
        const url = URL.createObjectURL(audioBlob);
  
        // Define o áudio diretamente no audioResponseRef e toca
        if (audioResponseRef.current) {
          audioResponseRef.current.src = url;
          audioResponseRef.current.play();
        }
      }
    } catch (error) {
      console.error('Erro ao enviar áudio para o backend:', error);
    }
  };

  const handleAudioEnd = () => {
    if (audioResponseRef.current) {
      audioResponseRef.current.src = '';
    }
	};


  return (
    <div 
      className={`
        min-h-screen flex flex-col items-center justify-center relative
        transition-all duration-700 ease-in-out cursor-pointer
        ${isRecording 
          ? 'bg-gradient-to-br from-blue-50 to-indigo-50' 
          : 'bg-white'
        }
      `}
      onClick={handleClick}
    >
      {(audioResponseRef.current && !audioResponseRef.current.paused) && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            stopAudioAndReset()
          }}
          className="absolute top-8 right-8 p-2 rounded-full from-blue-600 hover:bg-indigo-700 
            transition-colors duration-300 shadow-lg"
        >
          X
        </button>
      )}

      <div 
        className={`
          rounded-full 
          bg-gradient-to-br from-blue-600 to-indigo-800
          shadow-[0_8px_30px_rgb(0,0,0,0.12)]
          flex items-center justify-center
          transition-all duration-700 ease-in-out
          ${isThinking ? 'animate-pulse' : 'animate-float'}
          ${isRecording ? 'shadow-[0_0_50px_rgba(139,92,246,0.3)]' : ''}
          ${isLongText 
            ? 'w-32 h-32 md:w-40 md:h-40 mb-4 scale-95' 
            : 'w-48 h-48 md:w-80 md:h-80 mb-8'
          }
          cursor-pointer
          select-none
        `}
        onClick={(e) => {
          e.stopPropagation() // Prevent double triggering with background
          handleClick()
        }}
      />
      <div className={`
        flex justify-center items-center text-2xl tracking-wide
        transition-all duration-700 ease-in-out
        ${isLongText ? 'w-[80%] max-w-2xl' : 'w-80'}
      `}>
        <div className="relative flex justify-center items-center">
          <span className={`
            font-medium text-center
            bg-gradient-to-r from-blue-600 to-indigo-900 bg-clip-text
            transition-all duration-300
            ${isThinking || isRecording
              ? 'animate-pulse-text opacity-50' 
              : 'text-transparent'
            }
            ${isLongText ? 'text-xl leading-relaxed' : 'text-2xl'}
          `}>
            {message}
          </span>
          {(isThinking || isRecording) && (
            <span className="bg-gradient-to-r from-blue-600 to-indigo-900 bg-clip-text animate-pulse-text opacity-50">
              {dots}
            </span>
          )}
        </div>
      </div>
      <audio ref={audioResponseRef} onEnded={handleAudioEnd}>
        Seu navegador não suporta o elemento de áudio.
      </audio>
    </div>
  )
} 