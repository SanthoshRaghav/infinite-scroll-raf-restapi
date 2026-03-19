import React, { useState, useRef, useEffect } from 'react';
import './App.css';

const LIMIT = 10;

function computeHasMore(data, page, limit, headers) {
  const totalHeader = headers.get('x-total-count');
  if (totalHeader !== null) {
    const total = parseInt(totalHeader, 10);
    return page * limit < total;
  }

  return data.length === limit;
}

export default function App() {
  const [posts, setPosts] = useState([]);
  const feedAreaRef = useRef(null);
  const pageRef = useRef(1);
  const [isLoading, setIsLoading] = useState(false);
  const abortControllerRef = useRef(null);
  const isTicking = useRef(false);
  const isFetchingRef = useRef(false);
  const hasMoreRef = useRef(true);

  const fetchPosts = async (ignoreRef) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      setIsLoading(true);
      await new Promise((r) => setTimeout(r, 1000));
      const response = await fetch(
        `https://jsonplaceholder.typicode.com/posts?_page=${pageRef.current}&_limit=${LIMIT}`,
        { signal: controller.signal },
      );
      const data = await response.json();
      if (!ignoreRef.current) {
        setPosts((prev) => [...prev, ...data]);
        hasMoreRef.current = computeHasMore(
          data,
          pageRef.current,
          LIMIT,
          response.headers,
        );
        pageRef.current += 1;
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error(err);
      }
    } finally {
      if (!ignoreRef.current) {
        setIsLoading(false);
      }
      isFetchingRef.current = false;
    }
  };

  useEffect(() => {
    const el = feedAreaRef.current;
    const ignoreRef = { current: false };

    fetchPosts(ignoreRef);

    const handleScroll = () => {
      if (isTicking.current) return;
      isTicking.current = true;

      requestAnimationFrame(() => {
        const { clientHeight, scrollTop, scrollHeight } = el;
        if (
          clientHeight + scrollTop + 5 >= scrollHeight &&
          hasMoreRef.current
        ) {
          fetchPosts(ignoreRef);
        }
        isTicking.current = false;
      });
    };

    el.addEventListener('scroll', handleScroll);
    return () => {
      ignoreRef.current = true;
      abortControllerRef.current?.abort();
      isFetchingRef.current = false;
      el.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <section className="feed">
      <h1 className="feed-title">Posts</h1>
      <div className="feed-area" ref={feedAreaRef}>
        <ul className="feed-list">
          {posts.map((post) => (
            <Item key={post.id} title={post.title} id={post.id} />
          ))}
        </ul>
        {isLoading && <p className="feed-status">Loading...</p>}
        {!isLoading && !hasMoreRef.current && (
          <p className="feed-status">No More Posts</p>
        )}
      </div>
    </section>
  );
}

const Item = React.memo(function Item({ id, title }) {
  return (
    <li className="feed-item">
      {id} - {title}
    </li>
  );
});
