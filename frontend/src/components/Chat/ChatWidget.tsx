"use client";

import { useEffect, useState, useRef } from "react";
import { open as openEmbed } from "@play-ai/agent-web-sdk";

interface ChatWidgetProps {
  hasPdf: boolean;
  currentPageText: string;
  currentPageNumber: number;
}

const webEmbedId = process.env.NEXT_PUBLIC_PLAY_AI_WEB_EMBED_ID;


const ChatWidget: React.FC<ChatWidgetProps> = ({ 
    hasPdf, 
    currentPageText, 
    currentPageNumber 
  }) => {
    const [text, setText] = useState("Please upload a PDF");
  
    
    const events = [
      {
        name: "read-pdf",
        when: "The user says the uploaded pdf.",
        data: {
          text: { type: "string", description: "The PDF page content" },
        },
      },
    ] as const;
  
    const onEvent = (event: any) => {
    //   console.log("onEvent: ", event);
      if (event.name === "read-pdf") {
        setText(event.data.text);
      }
    };
  
    
    useEffect(() => {
      if (hasPdf && currentPageText) {
        setText(`Page ${currentPageNumber}: ${currentPageText}`);
      }
    }, [currentPageText, currentPageNumber, hasPdf]);
  
    
    useEffect(() => {
      openEmbed(webEmbedId, { events, onEvent });
    }, []);
  
    
    return (
      <div className="hidden">
        <div className="font-medium text-2xl">{text}</div>
      </div>
    );
  };
  
  export default ChatWidget;