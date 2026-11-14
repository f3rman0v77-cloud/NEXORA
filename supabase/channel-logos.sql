-- Apply after supabase/poll-channels.sql. Adds public channel logos and secure owner-only uploads.
alter table public.nexora_poll_channels add column if not exists logo_path text;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('nx-channel-logos','nx-channel-logos',true,2097152,array['image/png','image/jpeg','image/webp'])
on conflict(id) do update set public=true,file_size_limit=2097152,allowed_mime_types=excluded.allowed_mime_types;
drop policy if exists "nx channel logos public read" on storage.objects;
create policy "nx channel logos public read" on storage.objects for select to public
using(bucket_id='nx-channel-logos');
drop policy if exists "nx channel owner logo upload" on storage.objects;
create policy "nx channel owner logo upload" on storage.objects for insert to authenticated
with check(bucket_id='nx-channel-logos' and exists(
 select 1 from public.nexora_poll_channels c where c.id::text=(storage.foldername(name))[1] and c.owner_id=auth.uid()
));
create or replace function public.nx_channel_set_logo(p_channel uuid,p_path text)
returns void language plpgsql security definer set search_path='' as $$
begin
 if not exists(select 1 from public.nexora_poll_channels where id=p_channel and owner_id=auth.uid()) then raise exception 'Yalnız kanal sahibi loqonu dəyişə bilər';end if;
 if p_path !~ ('^'||p_channel::text||'/[0-9a-f-]{36}\\.(png|jpg|webp)$') then raise exception 'Loqo yolu yanlışdır';end if;
 if not exists(select 1 from storage.objects where bucket_id='nx-channel-logos' and name=p_path) then raise exception 'Loqo yüklənməyib';end if;
 update public.nexora_poll_channels set logo_path=p_path where id=p_channel;
end $$;
revoke all on function public.nx_channel_set_logo(uuid,text) from public,anon;
grant execute on function public.nx_channel_set_logo(uuid,text) to authenticated;
create or replace function public.nx_channel_feed(p_channel uuid default null)
returns jsonb language sql stable security definer set search_path='' as $$
 select jsonb_build_object(
 'channels',(select coalesce(jsonb_agg(jsonb_build_object('id',c.id,'name',c.name,'logo_path',c.logo_path,'description',c.description,'owner_id',c.owner_id,'editor_id',c.editor_id,'owner_name',coalesce(pr.username,'istifadəçi'),'followers',(select count(*) from public.nexora_poll_channel_follows f where f.channel_id=c.id),'following',exists(select 1 from public.nexora_poll_channel_follows f where f.channel_id=c.id and f.user_id=auth.uid())) order by c.created_at desc),'[]'::jsonb) from public.nexora_poll_channels c left join public.nexora_profiles pr on pr.id=c.owner_id),
 'polls',(select coalesce(jsonb_agg(jsonb_build_object('id',p.id,'channel_id',p.channel_id,'question',p.question,'ends_at',p.ends_at,'created_at',p.created_at,'author_id',p.author_id,'options',(select coalesce(jsonb_agg(jsonb_build_object('id',o.id,'label',o.label,'votes',(select count(*) from public.nexora_channel_poll_votes v where v.option_id=o.id)) order by o.position),'[]'::jsonb) from public.nexora_channel_poll_options o where o.poll_id=p.id),'my_vote',(select v.option_id from public.nexora_channel_poll_votes v where v.poll_id=p.id and v.user_id=auth.uid()),'likes',(select count(*) from public.nexora_channel_poll_likes l where l.poll_id=p.id),'liked',exists(select 1 from public.nexora_channel_poll_likes l where l.poll_id=p.id and l.user_id=auth.uid()),'comments',(select count(*) from public.nexora_channel_poll_comments m where m.poll_id=p.id)) order by p.created_at desc),'[]'::jsonb) from (select * from public.nexora_channel_polls where p_channel is null or channel_id=p_channel order by created_at desc limit 100) p)
 ) where auth.uid() is not null;
$$;
notify pgrst,'reload schema';
