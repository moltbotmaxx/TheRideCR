import React from "react";

export default function ScrollVideoSection() {
  const sectionRef = React.useRef(null);
  const videoRef = React.useRef(null);
  const hasPlayedThisViewRef = React.useRef(false);
  const videoSrc = `${import.meta.env.BASE_URL}landing.mov`;

  React.useEffect(() => {
    const section = sectionRef.current;
    const video = videoRef.current;
    if (!section || !video) return undefined;

    const resetVideo = () => {
      hasPlayedThisViewRef.current = false;
      video.pause();
      try {
        video.currentTime = 0;
      } catch {
        // Some mobile browsers reject seeks until metadata is ready.
      }
    };

    const playVideo = () => {
      if (hasPlayedThisViewRef.current) return;
      hasPlayedThisViewRef.current = true;
      video.currentTime = 0;
      video.playbackRate = 1.25;
      const playPromise = video.play();
      if (playPromise?.catch) {
        playPromise.catch(() => {
          hasPlayedThisViewRef.current = false;
        });
      }
    };

    const handleMetadata = () => {
      video.pause();
      video.playbackRate = 1.25;
    };

    if (video.readyState >= 1) {
      handleMetadata();
    } else {
      video.addEventListener("loadedmetadata", handleMetadata);
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || entry.intersectionRatio <= 0.01) {
          resetVideo();
          return;
        }

        if (entry.intersectionRatio >= 0.45) {
          playVideo();
        }
      },
      {
        root: section.closest(".mobile-screen") || null,
        threshold: [0, 0.01, 0.45, 0.75, 1]
      }
    );

    observer.observe(section);

    return () => {
      observer.disconnect();
      video.removeEventListener("loadedmetadata", handleMetadata);
    };
  }, []);

  return (
    <section className="scroll-video-section" aria-label="TheRideCR road film">
      <div className="scroll-video-frame" ref={sectionRef}>
        <video
          ref={videoRef}
          className="scroll-video"
          src={videoSrc}
          muted
          playsInline
          preload="auto"
          aria-hidden="true"
        />
        <div className="scroll-video-logo" aria-label="TheRideCR">
          <svg className="scroll-video-logo-mark" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <circle cx="18" cy="18" r="17" stroke="currentColor" strokeWidth="1.4" />
            <path d="M7 22 C 12 8, 24 8, 29 22" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            <circle cx="11.5" cy="22" r="2.2" fill="currentColor" />
            <circle cx="24.5" cy="22" r="2.2" fill="currentColor" />
            <path d="M11 22 L25 22" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
          <span><span>The</span>Ride<b>CR</b></span>
        </div>
      </div>
    </section>
  );
}
