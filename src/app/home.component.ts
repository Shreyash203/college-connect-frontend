import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="mx-auto flex max-w-6xl flex-col gap-8 rounded-[32px] border border-slate-200/80 bg-white/90 p-8 shadow-[0_24px_80px_rgba(15,23,42,0.12)] backdrop-blur-xl sm:p-10">
      <div class="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
        <div class="space-y-5">
          <p class="text-sm font-semibold uppercase tracking-[0.35em] text-blue-600">College Connect</p>
          <h1 class="text-5xl font-semibold leading-tight text-slate-950 sm:text-6xl">The premium campus community for student connections.</h1>
          <p class="max-w-2xl text-lg text-slate-600">Create your profile, discover peers with shared interests, and build better college relationships in a trusted social space.</p>
          <div class="flex flex-wrap gap-3">
            <a routerLink="/register" class="rounded-full bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700">Get started</a>
            <a routerLink="/login" class="rounded-full border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">Login</a>
          </div>
        </div>
        <div class="rounded-[28px] bg-slate-950 p-8 text-white shadow-[0_20px_50px_rgba(15,23,42,0.2)]">
          <p class="text-sm uppercase tracking-[0.35em] text-sky-300">Campus-first</p>
          <h2 class="mt-4 text-3xl font-semibold">Designed for campus life</h2>
          <ul class="mt-6 space-y-4 text-sm text-slate-200">
            <li class="flex items-start gap-3"><span class="mt-1 inline-flex h-8 w-8 items-center justify-center rounded-full bg-sky-400/20 text-sky-300">✓</span>Verified college members only</li>
            <li class="flex items-start gap-3"><span class="mt-1 inline-flex h-8 w-8 items-center justify-center rounded-full bg-sky-400/20 text-sky-300">✓</span>Interest-based discovery feed</li>
            <li class="flex items-start gap-3"><span class="mt-1 inline-flex h-8 w-8 items-center justify-center rounded-full bg-sky-400/20 text-sky-300">✓</span>Secure profiles and private community</li>
          </ul>
        </div>
      </div>
      <div class="grid gap-6 rounded-[24px] border border-slate-200/80 bg-slate-50 p-6 text-slate-700 sm:grid-cols-3">
        <div class="space-y-2">
          <p class="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">Premium experience</p>
          <p class="text-sm">Modern layout, fast access, and a welcoming campus-first design.</p>
        </div>
        <div class="space-y-2">
          <p class="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">Secure</p>
          <p class="text-sm">Built with student privacy and secure auth in mind.</p>
        </div>
        <div class="space-y-2">
          <p class="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">Connected</p>
          <p class="text-sm">Easy discovery of profiles and interests across your campus network.</p>
        </div>
      </div>
    </section>
  `,
  styles: []
})
export class HomeComponent {}
