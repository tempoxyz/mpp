"use client";

import blogPosts from "virtual:blog-posts";
import { useState } from "react";
import { BlogRow } from "./marketing/BlogRow";
import { Button } from "./marketing/Button";
import { Header } from "./marketing/Header";
import { LineLogo } from "./marketing/LineLogo";

const INITIAL_POSTS = 5;
const POST_STEP = 20;

export function BlogIndexPage() {
  const [visibleCount, setVisibleCount] = useState(INITIAL_POSTS);
  const shown = Math.min(visibleCount, blogPosts.length);

  return (
    <div className="marketing-route not-prose bg-[#101010] text-offwhite">
      <Header active="blog" />
      <main className="mx-auto w-full max-w-[1728px]">
        <section className="flex h-[231px] flex-col items-start justify-end px-4 pb-6 pt-12 md:h-[236px] md:px-12">
          <LineLogo
            className="h-[22px] w-auto max-w-full md:h-auto md:w-[305px]"
            label="Blog"
            name="blog"
          />
        </section>
        <section className="px-4 pb-20 md:px-12">
          <div className="flex flex-col gap-[60px] border-t border-border pt-6 xl:flex-row xl:gap-0">
            <div className="xl:w-1/2">
              <h1 className="font-sans !text-[32px] font-normal !leading-[1.1] !tracking-[-0.32px] text-offwhite">
                MPP protocol updates
              </h1>
            </div>
            <div className="flex flex-col gap-14 xl:w-1/2">
              <div className="flex flex-col">
                {blogPosts.slice(0, shown).map((post) => (
                  <BlogRow headingLevel="h2" key={post.to} post={post} />
                ))}
              </div>
              <div className="flex items-center justify-between">
                <p className="font-mono text-sm uppercase tracking-normal !text-white/60">
                  1–{shown} of {blogPosts.length}
                </p>
                {shown < blogPosts.length && (
                  <Button
                    onClick={() =>
                      setVisibleCount((count) =>
                        Math.min(count + POST_STEP, blogPosts.length),
                      )
                    }
                  >
                    Show more
                  </Button>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
