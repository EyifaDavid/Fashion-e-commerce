import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Button from "./Button";
import {MdArrowBack, MdArrowForward} from "react-icons/md"
 
export default function DisplaySlider({ displays = [] }) {
  const scrollRef = useRef(null);
    const [showLeft, setShowLeft] = useState(false);
    const [showRight, setShowRight] = useState(false);

    // Scroll left or right
    const scroll = (direction) => {
      const { current } = scrollRef;
      if (current) {
        const scrollAmount = direction === "left" ? -300 : 300;
        current.scrollBy({ left: scrollAmount, behavior: "smooth" });
      }
    };
  
    // Update visibility of scroll buttons
    const checkScroll = () => {
      const el = scrollRef.current;
      if (!el) return;
      setShowLeft(el.scrollLeft > 0);
      setShowRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1); // adjust for rounding errors
    };
  
    useEffect(() => {
      checkScroll();
      const el = scrollRef.current;
      if (!el) return;
  
      el.addEventListener("scroll", checkScroll);
      window.addEventListener("resize", checkScroll);
  
      return () => {
        el.removeEventListener("scroll", checkScroll);
        window.removeEventListener("resize", checkScroll);
      };
    }, [displays]);

  return (
    <div className="relative py-10">

      {/* Scroll buttons */}
  {showLeft && (
   <Button
          type="button"
          onClick={() => scroll("left")}
          icon={<MdArrowBack />}
          className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full border bg-white"
        />
      )}

      {showRight && (
        <Button
          type="button"
          onClick={() => scroll("right")}
          icon={<MdArrowForward />}
          className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full border bg-white"
        />
      )}

    <div
  ref={scrollRef}
  className="flex overflow-x-auto space-x-4 scroll-smooth scrollbar-hide"
>
        {displays.map((display) => (
          <Link
            key={display.id}
            to={`/display/${display.id}`}
            state={{ display }}
            className="min-w-[550px] shadow-md rounded-lg  overflow-hidden"
          ><div className="bg-amber-50 h-full relative">
            <img
              src={display.image}
              alt={display.name}
              className="h-full w-full object-cover rounded"
            />

             <div className="bg-black h-2/4 flex pt-10 p-4 justify-center items-center gap-20 absolute inset-0 top-40">
                <Button
                label="Find Out More"
                type="Submit"
                className="rounded-full bg-white text-sm w-80 h-12"
                />

                <div className="max-w-[300px] text-white">{display.description}</div>

            </div>
            </div>

        
          </Link>
          
        ))}
        
      </div>

         <Button
      type="submit" 
      onClick={() => scroll("right")}
      icon = <MdArrowForward/>
      className="absolute right-2 top-1/2 -translate-y-1/2 z-5 w-10 h-10 rounded-full border bg-white "
      />
    </div>
  );
}
