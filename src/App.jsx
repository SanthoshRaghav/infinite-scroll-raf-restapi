import React, { useCallback, useEffect, useRef, useState } from 'react';
import './App.css';

const LIMIT = 10;

export default function App() {
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsloading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const pageRef = useRef(1);
  const feedAreaRef = useRef(null);
  const isFetechingRef = useRef(false);
  const isTickingRef = useRef(false);

  const fetchPosts = useCallback(
    async (signal) => {
      if (isFetechingRef.current || !hasMore) return;
      isFetechingRef.current = true;

      try {
        setIsloading(true);
        await new Promise((r) => setTimeout(r, 1000));
        const response = await fetch(
          `https://jsonplaceholder.typicode.com/posts?_page=${pageRef.current}&_limit=${LIMIT}`,
          signal ? { signal } : {}
        );
        const data = await response.json();
        setPosts((prev) => [...prev, ...data]);
        pageRef.current += 1;
        if (data.length < LIMIT) {
          setHasMore(false);
        }
      } catch (err) {
        if (!signal?.aborted) {
          console.error(err);
        }
      } finally {
        setIsloading(false);
        isFetechingRef.current = false;
      }
    },
    [hasMore]
  );

  useEffect(() => {
    const controller = new AbortController();
    fetchPosts(controller.signal);
    return () => {
      controller.abort();
      isFetechingRef.current = false;
    };
  }, []);

  useEffect(() => {
    const el = feedAreaRef.current;

    const handleScroll = () => {
      if (isTickingRef.current) return;
      isTickingRef.current = true;

      requestAnimationFrame(() => {
        isTickingRef.current = false;
        const { clientHeight, scrollTop, scrollHeight } = el;

        if (clientHeight + scrollTop + 5 >= scrollHeight) {
          fetchPosts();
        }
      });
    };

    el.addEventListener('scroll', handleScroll);
    return () => {
      el.removeEventListener('scroll', handleScroll);
    };
  }, [fetchPosts]);

  return (
    <section className="feed">
      <h1 className="feed-title">Posts</h1>
      <div ref={feedAreaRef} className="feed-area">
        <ul className="feed-list">
          {posts.map((post) => (
            <Item key={post.id} id={post.id} title={post.title} />
          ))}
        </ul>
        {isLoading && <p className="feed-status">Loading...</p>}
        {!hasMore && !isLoading && <p className="feed-status">No more posts</p>}
      </div>
    </section>
  );
}

const Item = React.memo(function Item({ id, title }) {
  return (
    <li className="feed-item">
      {id}. {title}
    </li>
  );
});
