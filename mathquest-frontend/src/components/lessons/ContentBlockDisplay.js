import React from "react";
import { Header } from "../../ui/heading";
import { useTheme } from "../../context/ThemeContext";
import "../../styles/ContentBlockDisplay.css";

const ContentBlockDisplay = ({ block }) => {
  const { darkMode } = useTheme();
  
  if (!block) {
    return null;
  }

  // If the block has structuredContent or content but no type, render it directly
  if (!block.type && (block.structuredContent || block.content)) {
    return (
      <div
        className={`rich-text-content ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}
        dangerouslySetInnerHTML={{
          __html: block.structuredContent || block.content,
        }}
      />
    );
  }

  const renderContent = () => {
    switch (block.type) {
      case "TEXT":
        return <div className={`${darkMode ? 'text-gray-200' : 'text-gray-900'}`} dangerouslySetInnerHTML={{ __html: block.content }} />;

      case "HEADING1":
        return (
          <Header type="h1" size="4xl" className={darkMode ? 'text-gray-100' : 'text-gray-900'}>
            {block.content}
          </Header>
        );

      case "HEADING2":
        return (
          <Header type="h2" size="3xl" className={darkMode ? 'text-gray-100' : 'text-gray-900'}>
            {block.content}
          </Header>
        );

      case "HEADING3":
        return (
          <Header type="h3" size="2xl" className={darkMode ? 'text-gray-100' : 'text-gray-900'}>
            {block.content}
          </Header>
        );

      case "PARAGRAPH":
        return <p className={darkMode ? 'text-gray-200' : 'text-gray-900'}>{block.content}</p>;

      case "IMAGE":
        if (block.mediaUrl) {
          return (
            <img
              src={block.mediaUrl}
              alt={block.altText || "Lesson content image"}
              style={{ maxWidth: "100%", height: "auto" }}
            />
          );
        }
        return (
          <p className={darkMode ? 'text-gray-200' : 'text-gray-900'}>
            <em>Image not available.</em>
          </p>
        );

      case "VIDEO":
        if (block.mediaUrl) {
          if (
            block.mediaUrl.includes("youtube.com") ||
            block.mediaUrl.includes("youtu.be")
          ) {
            const videoId =
              block.mediaUrl.split("v=")[1]?.split("&")[0] ||
              block.mediaUrl.split("/").pop();
            return (
              <iframe
                width="560"
                height="315"
                src={`https://www.youtube.com/embed/${videoId}`}
                title={block.caption || "YouTube video player"}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            );
          }
          return (
            <video controls src={block.mediaUrl} style={{ maxWidth: "100%" }}>
              Your browser does not support the video tag.
            </video>
          );
        }
        return (
          <p className={darkMode ? 'text-gray-200' : 'text-gray-900'}>
            <em>Video not available.</em>
          </p>
        );

      case "LINK":
        if (block.url && block.content) {
          return (
            <a 
              href={block.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className={darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}
            >
              {block.content}
            </a>
          );
        }
        return (
          <p className={darkMode ? 'text-gray-200' : 'text-gray-900'}>
            <em>Link information missing.</em>
          </p>
        );

      // Add more cases for other block types like LIST, QUOTE, CODE_BLOCK, etc.
      // case 'LIST':
      //   // Assuming block.content is an array of items for a list
      //   return (
      //     <ul>
      //       {block.items && block.items.map((item, index) => <li key={index}>{item}</li>)}
      //     </ul>
      //   );

      default:
        console.warn("Unsupported content block type:", block.type);
        // Fallback to render any content or structuredContent if available
        if (block.structuredContent || block.content) {
          return (
            <div
              className={`rich-text-content ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}
              dangerouslySetInnerHTML={{
                __html: block.structuredContent || block.content,
              }}
            />
          );
        }
        return (
          <div>
            <p className={darkMode ? 'text-gray-200' : 'text-gray-900'}>Unsupported content type: {block.type}</p>
            {block.content && <p className={darkMode ? 'text-gray-200' : 'text-gray-900'}>{block.content}</p>}
          </div>
        );
    }
  };

  return (
    <div
      className={`content-block content-block-${
        block.type?.toLowerCase() || "default"
      }`}
    >
      {renderContent()}
    </div>
  );
};

export default ContentBlockDisplay;
