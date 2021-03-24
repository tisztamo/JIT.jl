var documenterSearchIndex = {"docs":
[{"location":"usage/#Usage-1","page":"Usage","title":"Usage","text":"","category":"section"},{"location":"usage/#","page":"Usage","title":"Usage","text":"Let's say you have a long-running calculation, organized into batches:","category":"page"},{"location":"usage/#","page":"Usage","title":"Usage","text":"function runbatches()\n    for batchidx = 1:1000\n        hotloop()\n        # Log progress, etc.\n    end\nend","category":"page"},{"location":"usage/#","page":"Usage","title":"Usage","text":"The hot loop calls the type-unstable function get_some_x() and passes its result to a relatively cheap calculation calc_with_x().","category":"page"},{"location":"usage/#","page":"Usage","title":"Usage","text":"function hotloop()\n    for i = 1:1_000_000\n        x = get_some_x(i)\n        calc_with_x(x)\n    end\nend\n\nconst xs = Any[1, 2.0, ComplexF64(3.0, 3.0)]\nget_some_x(i) = xs[i % length(xs) + 1]\n\nconst result = Ref(ComplexF64(0.0, 0.0))\n\nfunction calc_with_x(x)\n    result[] += x\nend","category":"page"},{"location":"usage/#","page":"Usage","title":"Usage","text":"As get_some_x is not type-stable, calc_with_x must be dynamically dispatched, which slows down the calculation.","category":"page"},{"location":"usage/#","page":"Usage","title":"Usage","text":"Sometimes it is not feasible to type-stabilize get_some_x. *","category":"page"},{"location":"usage/#","page":"Usage","title":"Usage","text":"Catwalk.jl is here for those cases. You mark hotloop, the outer function (the one which has the dynamic call site in its body) with the @jit macro and provide the name of the dynamically dispatched function and the argument to operate on (the API will hopefully improve in the future). You also have to add an extra argument named jitctx to the jit-ed function:","category":"page"},{"location":"usage/#","page":"Usage","title":"Usage","text":"using Catwalk\n\n@jit calc_with_x x function hotloop_jit(jitctx)\n    for i = 1:1_000_000\n        x = get_some_x(i)\n        calc_with_x(x)\n    end\nend","category":"page"},{"location":"usage/#","page":"Usage","title":"Usage","text":"The Catwalk optimizer will provide you the jitctx context which you have to pass to the jit-ed function manually. Also, every batch needs a bit more housekeeping to drive the Catwalk optimizer:","category":"page"},{"location":"usage/#","page":"Usage","title":"Usage","text":"function runbatches_jit()\n    opt = Catwalk.RuntimeOptimizer()\n    for batch = 1:1000\n        Catwalk.step!(opt)\n        hotloop_jit(Catwalk.ctx(opt))\n    end\nend","category":"page"},{"location":"usage/#","page":"Usage","title":"Usage","text":"Yes, it is a bit complicated to integrate your code with Catwalk, but it may worth the effort:","category":"page"},{"location":"usage/#","page":"Usage","title":"Usage","text":"result[] = ComplexF64(0, 0)\n@time runbatches_jit()\n\n# 4.608471 seconds (4.60 M allocations: 218.950 MiB, 0.56% gc time, 21.68% compilation time)\n\njit_result = result[]\n\nresult[] = ComplexF64(0, 0)\n@time runbatches()\n\n# 23.387341 seconds (1000.00 M allocations: 29.802 GiB, 7.71% gc time)","category":"page"},{"location":"usage/#","page":"Usage","title":"Usage","text":"And the results are the same:","category":"page"},{"location":"usage/#","page":"Usage","title":"Usage","text":"jit_result == result[] || error(\"JIT must be a no-op!\")","category":"page"},{"location":"usage/#","page":"Usage","title":"Usage","text":"Please note that the speedup depends on the portion of the runtime spent in dynamic dispatch, which is most likely smaller in your case than in this contrived example.","category":"page"},{"location":"usage/#","page":"Usage","title":"Usage","text":"You can find this example under docs/src/usage.jl in the repo.","category":"page"},{"location":"usage/#","page":"Usage","title":"Usage","text":"","category":"page"},{"location":"usage/#","page":"Usage","title":"Usage","text":"This page was generated using Literate.jl.","category":"page"},{"location":"#Catwalk.jl-Intro-1","page":"Catwalk.jl Intro","title":"Catwalk.jl Intro","text":"","category":"section"},{"location":"#","page":"Catwalk.jl Intro","title":"Catwalk.jl Intro","text":"Catwalk.jl can speed up long-running Julia processes by minimizing the overhead of dynamic dispatch.","category":"page"},{"location":"#","page":"Catwalk.jl Intro","title":"Catwalk.jl Intro","text":"(Image: Speedup demo)","category":"page"},{"location":"#","page":"Catwalk.jl Intro","title":"Catwalk.jl Intro","text":"It profiles user-specified call sites, estimating the distribution of dynamically dispatched types during runtime, and generates fast static routes for the most frequent ones on the fly.","category":"page"},{"location":"#","page":"Catwalk.jl Intro","title":"Catwalk.jl Intro","text":"The statistical profiler has very low overhead and can be configured to handle situations where the distribution of dispatched types changes relatively fast.","category":"page"},{"location":"#","page":"Catwalk.jl Intro","title":"Catwalk.jl Intro","text":"To minimize compilation overhead, recompilation only occurs when the distribution changed enough so that the  included cost model predicts significant speedup compared to the best version that was previously compiled.","category":"page"},{"location":"#When-to-use-this-package-1","page":"Catwalk.jl Intro","title":"When to use this package","text":"","category":"section"},{"location":"#","page":"Catwalk.jl Intro","title":"Catwalk.jl Intro","text":"The dynamic dispatch in Julia is very fast in itself, so speeding it up is not an easy task. Catwalk.jl focuses on use cases when it is not feasible to list the dynamically dispatched concrete types in the source code of the call site.","category":"page"},{"location":"#","page":"Catwalk.jl Intro","title":"Catwalk.jl Intro","text":"Catwalk.jl assumes the followings:","category":"page"},{"location":"#","page":"Catwalk.jl Intro","title":"Catwalk.jl Intro","text":"The process is long running: several seconds, but possibly minutes are needed to break even after the initial compilation overhead.\nFew dynamically dispatched call sites contribute significantly to the running time (dynamic dispatch in a hot loop).\nYou can modify the source code around the interesting call sites (add a macro call), and calculation is organized into batches.","category":"page"},{"location":"#Alternatives-1","page":"Catwalk.jl Intro","title":"Alternatives","text":"","category":"section"},{"location":"#","page":"Catwalk.jl Intro","title":"Catwalk.jl Intro","text":"FunctionWrappers.jl will get you type stability for a fixed (?) cost.\nManualDispatch.jl can serve you better in less dynamic cases, when it is feasible to list the dynamically dispatched types in the source code.\nIn even simpler cases using unions instead of a type hierarchy may allow the Julia compiler to \"split the union\". See for example List performance improvent by Union-typed tail in DataStructures.jl.","category":"page"}]
}
