"use client";

import Image from "next/image";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "~/ui/primitives/button";
import { Card, CardContent } from "~/ui/primitives/card";

// 示例图片数据
const sampleImages = [
  { alt: "Sample 1", src: "/assets/image/simple-1.png" },
  { alt: "Sample 2", src: "/assets/image/simple-2.png" },
  { alt: "Sample 3", src: "/assets/image/simple-3.png" },
  { alt: "Sample 4", src: "/assets/image/simple-4.png" },
];

// 分类数据
const categories = ["light", "flowers", "interior", "history", "clothes"];

// 对比图片数据
const beforeAfterImages = [
  {
    after: "/assets/image/after-1.png",
    alt: "Comparison 1",
    before: "/assets/image/before-1.png",
  },
  {
    after: "/assets/image/after-2.png",
    alt: "Comparison 2",
    before: "/assets/image/before-2.png",
    hasNewPalette: true,
  },
  {
    after: "/assets/image/after-3.png",
    alt: "Comparison 3",
    before: "/assets/image/before-3.png",
  },
  {
    after: "/assets/image/after-4.png",
    alt: "Comparison 4",
    before: "/assets/image/before-4.png",
    hasNewPalette: true,
  },
  {
    after: "/assets/image/after-5.png",
    alt: "Comparison 5",
    before: "/assets/image/before-5.png",
    hasNewPalette: true,
  },
];

// 效果展示图片
const effectImages = [
  "/assets/image/effect-1.png",
  "/assets/image/effect-2.png",
  "/assets/image/effect-3.png",
  "/assets/image/effect-4.png",
  "/assets/image/effect-5.png",
  "/assets/image/effect-6.png",
];

// 用户评价数据
const testimonials = [
  {
    avatar: "linear-gradient(135deg,#a8edea,#fed6e3)",
    handle: "@john",
    image: "/assets/image/user-work-1.png",
    text: "I'm at a loss for words. This is amazing. I love it. The color is so vivid and the details are incredible!",
    user: "John",
  },
  {
    avatar: "linear-gradient(135deg,#f6d365,#fda085)",
    handle: "@jack",
    text: "I've never seen anything like this before. It's amazing. I love it.",
    user: "Jack",
  },
  {
    avatar: "linear-gradient(135deg,#a18cd1,#fbc2eb)",
    handle: "@jill",
    text: "I don't know what to say. I'm speechless.",
    user: "Jill",
  },
  {
    avatar: "linear-gradient(135deg,#43cea2,#185a9d)",
    handle: "@james",
    image: "/assets/image/user-work-2.png",
    text: "I'm at a loss for words. This is amazing. I love it.",
    user: "James",
  },
  {
    avatar: "linear-gradient(135deg,#f7971e,#ffd200)",
    handle: "@jane",
    text: "Love the results! Highly recommended. My family is amazed by the transformation.",
    user: "Jane",
  },
  {
    avatar: "linear-gradient(135deg,#f953c6,#b91d73)",
    handle: "@tom",
    image: "/assets/image/user-work-3.png",
    text: "I recommend this to all my friends. Great job! So easy to use and the results are fantastic!",
    user: "Tom",
  },
];

export default function HomePage() {
  const { t } = useTranslation("common");
  const [activeCategory, setActiveCategory] = useState(0);
  const [activeSlide, setActiveSlide] = useState(1);

  const handleFileUpload = () => {
    // 处理文件上传逻辑
    console.log("File upload clicked");
  };

  const handleSampleClick = (index: number) => {
    // 处理示例图片点击逻辑
    console.log(`Sample ${index + 1} clicked`);
  };

  return (
    <div className="min-h-screen bg-background">
      <section className="bg-black text-white">
        <div
          className={`
            mx-auto flex max-w-7xl flex-col items-center gap-8 px-4
            lg:flex-row lg:gap-16
          `}
        >
          <div
            className={`
              relative flex h-[555px] flex-1 items-center justify-center
            `}
          >
            <div
              className={`
                image-showcase relative flex h-full w-full items-center
                justify-center
              `}
            >
              {/* 原始黑白照片 */}
              <div
                className={`
                  absolute z-10 overflow-hidden rounded-xl bg-white shadow-2xl
                  grayscale
                `}
                style={{
                  height: "clamp(220px, 25vw, 352px)",
                  left: "20%",
                  top: "50%",
                  transform: "translateX(-50%) translateY(-50%) rotate(-6deg)",
                  width: "clamp(140px, 16vw, 224px)",
                }}
              >
                <Image
                  alt="Original Black and White Photo"
                  className="object-cover"
                  fill
                  src="/assets/image/original-bw.png"
                />
              </div>

              {/* 彩色照片堆叠容器 */}
              <div
                className="absolute flex items-center justify-center"
                style={{
                  height: "clamp(232px, 26.1vw, 387px)",
                  left: "80%",
                  perspective: "1800px",
                  top: "50%",
                  transform: "translateX(-50%) translateY(-50%)",
                  width: "clamp(300px, 35vw, 450px)",
                }}
              >
                {/* 彩色照片1 - 左侧 */}
                <div
                  className={`
                    absolute overflow-hidden rounded-xl bg-white shadow-xl
                  `}
                  style={{
                    backfaceVisibility: "hidden",
                    height: "clamp(186px, 21vw, 310px)",
                    transform:
                      "translateX(clamp(-75px, -8.5vw, -115px)) translateY(clamp(10px, 1.2vw, 20px)) rotate(-40deg) translateZ(clamp(-50px, -6vw, -85px))",
                    transformOrigin: "center center",
                    width: "clamp(120px, 13.5vw, 200px)",
                    zIndex: 2,
                  }}
                >
                  <Image
                    alt="Colorized Photo 1"
                    className="object-cover"
                    fill
                    src="/assets/image/colorized-1.png"
                  />
                </div>

                {/* 彩色照片2 - 中间突出 */}
                <div
                  className="absolute overflow-hidden rounded-xl bg-white"
                  style={{
                    backfaceVisibility: "hidden",
                    boxShadow:
                      "0 18px 35px rgba(0,0,0,0.3), 0 12px 12px rgba(0,0,0,0.25)",
                    height: "clamp(186px, 21vw, 310px)",
                    transform:
                      "scale(1.22) translateZ(clamp(15px, 1.8vw, 25px))",
                    transformOrigin: "center center",
                    width: "clamp(120px, 13.5vw, 200px)",
                    zIndex: 3,
                  }}
                >
                  <Image
                    alt="Colorized Photo 2"
                    className="object-cover"
                    fill
                    src="/assets/image/colorized-2.png"
                  />
                </div>

                {/* 彩色照片3 - 右侧 */}
                <div
                  className={`
                    absolute overflow-hidden rounded-xl bg-white shadow-xl
                  `}
                  style={{
                    backfaceVisibility: "hidden",
                    height: "clamp(186px, 21vw, 310px)",
                    transform:
                      "translateX(clamp(75px, 8.5vw, 115px)) translateY(clamp(10px, 1.2vw, 20px)) rotate(40deg) translateZ(clamp(-50px, -6vw, -85px))",
                    transformOrigin: "center center",
                    width: "clamp(120px, 13.5vw, 200px)",
                    zIndex: 2,
                  }}
                >
                  <Image
                    alt="Colorized Photo 3"
                    className="object-cover"
                    fill
                    src="/assets/image/colorized-3.png"
                  />
                </div>
              </div>
            </div>
          </div>

          <div
            className={`
              mx-auto flex max-w-md flex-1 flex-col items-center justify-center
              gap-4 text-center
              lg:mx-0 lg:-translate-x-4 lg:transform
            `}
          >
            <h1
              className={`
                text-3xl leading-tight font-bold
                md:text-4xl
                lg:text-5xl
              `}
            >
              {t("heroTitle")}
            </h1>
            <p
              className={`
                max-w-sm text-base text-gray-300
                md:text-lg
              `}
            >
              {t("heroDescription")}
            </p>
            <div className="my-1 flex items-center gap-2">
              <div className="flex text-yellow-400">
                <span>★★★★★</span>
              </div>
              <span className="text-sm text-gray-300">{t("hero.rating")}</span>
            </div>
            {/* <Button
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold rounded-full w-full max-w-xs"
              size="lg"
              startContent={<Icons.Upload size={20} />}
              onClick={handleFileUpload}
            >
              {t("hero.colorizeBtn")}
            </Button> */}
            <Button
              className={`
                transform rounded-full bg-gradient-to-r from-purple-500
                to-pink-500 px-12 py-4 text-lg font-semibold text-white
                shadow-lg transition-all duration-300
                hover:scale-105 hover:from-purple-600 hover:to-pink-600
                hover:shadow-xl
              `}
              onClick={handleFileUpload}
              size="lg"
              // startContent={<Icons.Upload size={20} />}
            >
              {t("colorizePhoto")}
            </Button>
            <p className="mt-2 text-sm text-gray-400"> {t("sampleText")}</p>
            <div className="flex space-x-3">
              {sampleImages.map((item, index) => (
                <div
                  className={`
                    h-16 w-16 cursor-pointer overflow-hidden rounded-lg border
                    border-gray-600 transition-transform duration-200
                    hover:scale-110 hover:border-purple-400
                  `}
                  key={index}
                >
                  <Image
                    alt={`Sample ${index + 1}`}
                    className="h-full w-full object-cover"
                    height={80}
                    src={item.src}
                    width={80}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
      {/* Trusted Section */}
      <section className="bg-muted/30 py-16">
        <div className="container mx-auto px-4">
          <div
            className={`
              grid grid-cols-1 gap-8
              md:grid-cols-3
            `}
          >
            {/* Column 1 */}
            <div className="space-y-4 text-center">
              <p
                className={`
                  text-sm font-medium tracking-wide text-muted-foreground
                  uppercase
                `}
              >
                {t("trustedInProductions")}
              </p>
              <div className="space-y-2">
                <p className="text-lg font-semibold text-foreground">
                  "{t("remarkablyAccurate")}"
                </p>
                <p className="text-sm text-muted-foreground">
                  - Kevin Kelly, Founding Editor, Wired
                </p>
              </div>
            </div>

            {/* Column 2 */}
            <div className="space-y-4 text-center">
              <div className="flex justify-center">
                <Image
                  alt="History Channel Logo"
                  className="h-10 w-auto"
                  height={40}
                  src="/assets/image/history-channel.svg"
                  width={120}
                />
              </div>
              <div className="space-y-2">
                <p className="text-lg font-semibold text-foreground">
                  "{t("worldsBestAI")}"
                </p>
                <p className="text-sm text-muted-foreground">
                  - PIXimperfect, Photoshop Expert, 4M Subscribers on YouTube
                </p>
              </div>
            </div>

            {/* Column 3 */}
            <div className="space-y-4 text-center">
              <div className="flex justify-center">
                <Image
                  alt="BBC Logo"
                  className="h-10 w-auto"
                  height={40}
                  src="/assets/image/bbc-logo.svg"
                  width={80}
                />
              </div>
              <div className="space-y-2">
                <p className="text-lg font-semibold text-foreground">
                  "{t("inALeagueOfItsOwn")}"
                </p>
                <p className="text-sm text-muted-foreground">
                  - Bycloud, AI Expert, 112K Subscribers on YouTube
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Experience The Difference Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="space-y-8 text-center">
            <h2
              className={`
                text-3xl font-bold text-foreground
                lg:text-4xl
              `}
            >
              {t("experienceTheDifference")}
            </h2>

            {/* Category Buttons */}
            <div className="flex flex-wrap justify-center gap-4">
              {categories.map((category, index) => (
                <Button
                  className="capitalize"
                  key={category}
                  onClick={() => setActiveCategory(index)}
                  variant={activeCategory === index ? "default" : "outline"}
                >
                  {t(category)}
                </Button>
              ))}
            </div>

            {/* Before/After Slider */}
            <div className="relative overflow-hidden">
              <div className="flex justify-center">
                <div
                  className={`flex space-x-6 transition-transform duration-300`}
                >
                  {beforeAfterImages.map((item, index) => {
                    const isActive = index === activeSlide;
                    const isFaded = Math.abs(index - activeSlide) > 1;

                    return (
                      <Card
                        className={`
                          flex-shrink-0 transition-all duration-300
                          ${
                            isActive
                              ? "scale-100 opacity-100"
                              : isFaded
                              ? `scale-90 opacity-30`
                              : `scale-95 opacity-70`
                          }
                        `}
                        key={index}
                      >
                        <CardContent className="p-6">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="relative">
                              <div
                                className={`
                                  absolute top-2 left-2 z-10 rounded bg-black/70
                                  px-2 py-1 text-xs font-semibold text-white
                                `}
                              >
                                {t("before")}
                              </div>
                              <Image
                                alt={`${item.alt} Before`}
                                className="rounded-lg"
                                height={250}
                                src={item.before}
                                width={200}
                              />
                            </div>
                            <div className="relative">
                              <div
                                className={`
                                  absolute top-2 left-2 z-10 rounded bg-black/70
                                  px-2 py-1 text-xs font-semibold text-white
                                `}
                              >
                                {t("after")}
                              </div>
                              <Image
                                alt={`${item.alt} After`}
                                className="rounded-lg"
                                height={250}
                                src={item.after}
                                width={200}
                              />
                              {item.hasNewPalette && (
                                <Button
                                  className={`
                                    absolute right-2 bottom-2 bg-gradient-to-r
                                    from-purple-500 to-pink-500 text-xs
                                  `}
                                  size="sm"
                                >
                                  {t("newPalette")}{" "}
                                  <span className="ml-1">🪄</span>
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>

              {/* Navigation Arrows */}
              <Button
                className="absolute top-1/2 left-4 -translate-y-1/2 transform"
                disabled={activeSlide === 0}
                onClick={() => setActiveSlide(Math.max(0, activeSlide - 1))}
                size="icon"
                variant="outline"
              >
                ←
              </Button>
              <Button
                className="absolute top-1/2 right-4 -translate-y-1/2 transform"
                disabled={activeSlide === beforeAfterImages.length - 1}
                onClick={() =>
                  setActiveSlide(
                    Math.min(beforeAfterImages.length - 1, activeSlide + 1)
                  )
                }
                size="icon"
                variant="outline"
              >
                →
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="bg-muted/30 py-20">
        <div className="container mx-auto px-4">
          <div className="space-y-12 text-center">
            <h2
              className={`
                text-3xl font-bold text-foreground
                lg:text-4xl
              `}
            >
              {t("trustedByPhotographers")}
            </h2>

            {/* Scrolling Testimonials */}
            <div className="relative overflow-hidden">
              <div
                className={`
                  absolute top-0 left-0 z-10 h-full w-20 bg-gradient-to-r
                  from-muted/30 to-transparent
                `}
              />
              <div
                className={`
                  absolute top-0 right-0 z-10 h-full w-20 bg-gradient-to-l
                  from-muted/30 to-transparent
                `}
              />

              {/* Top Row */}
              <div className="animate-scroll-left mb-6 flex space-x-6">
                {[...testimonials, ...testimonials].map(
                  (testimonial, index) => (
                    <Card className="w-80 flex-shrink-0" key={`top-${index}`}>
                      <CardContent className="p-6">
                        <div className="flex items-start space-x-4">
                          <div
                            className="h-10 w-10 flex-shrink-0 rounded-full"
                            style={{ background: testimonial.avatar }}
                          />
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-semibold">
                                {testimonial.user}
                              </span>
                              <span className="text-sm text-muted-foreground">
                                {testimonial.handle}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {testimonial.text}
                            </p>
                            {testimonial.image && (
                              <Image
                                alt="User work"
                                className="mt-2 rounded-lg"
                                height={150}
                                src={testimonial.image}
                                width={200}
                              />
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                )}
              </div>

              {/* Bottom Row */}
              <div className="animate-scroll-right flex space-x-6">
                {[
                  ...testimonials.slice().reverse(),
                  ...testimonials.slice().reverse(),
                ].map((testimonial, index) => (
                  <Card className="w-80 flex-shrink-0" key={`bottom-${index}`}>
                    <CardContent className="p-6">
                      <div className="flex items-start space-x-4">
                        <div
                          className="h-10 w-10 flex-shrink-0 rounded-full"
                          style={{ background: testimonial.avatar }}
                        />
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-semibold">
                              {testimonial.user}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              {testimonial.handle}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {testimonial.text}
                          </p>
                          {testimonial.image && (
                            <Image
                              alt="User work"
                              className="mt-2 rounded-lg"
                              height={150}
                              src={testimonial.image}
                              width={200}
                            />
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AI Colorization Gallery */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="space-y-12 text-center">
            <div className="space-y-4">
              <h2
                className={`
                  text-3xl font-bold text-foreground
                  lg:text-4xl
                `}
              >
                {t("newGenerationAI")}
              </h2>
              <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
                {t("yearsOfResearch")}
              </p>
            </div>

            {/* Gallery Grid */}
            <div
              className={`
                grid grid-cols-2 gap-4
                md:grid-cols-3
                lg:grid-cols-6
              `}
            >
              {effectImages.map((image, index) => (
                <div
                  className={`
                    overflow-hidden rounded-lg shadow-lg transition-shadow
                    hover:shadow-xl
                  `}
                  key={index}
                >
                  <Image
                    alt={`Effect ${index + 1}`}
                    className={`
                      h-auto w-full object-cover transition-transform
                      duration-300
                      hover:scale-105
                    `}
                    height={250}
                    src={image}
                    width={200}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="bg-gradient-to-r from-primary to-primary/80 py-20">
        <div className="container mx-auto px-4">
          <div className="space-y-8 text-center">
            <h2
              className={`
                text-3xl font-bold text-primary-foreground
                lg:text-4xl
              `}
            >
              {t("millionPhotosColorized")}
            </h2>
            <Button
              className={`
                bg-white px-8 py-4 text-lg font-semibold text-primary
                hover:bg-white/90
              `}
              onClick={handleFileUpload}
              size="lg"
              variant="secondary"
            >
              {t("getStartNow")}
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
