require "fileutils"

NE_STATSD_BACKEND_VERSION = '0.1.0'
RELEASE_PREFIX = '1soundcloud'
RELEASE = RELEASE_PREFIX + (ENV['BUILD_NUMBER'] || 'XXXXX')

task :default do
  puts "Please run rake -T to get a listing of available tasks."
end

desc "Produce a debian package of ne-statsd-backend."
task :package => [:tmpdir, :export_dir, :git_export] do
  # Ensure the destination package file is not already present - fpm freaks out
  output_filename = "ne-statsd-backend_#{NE_STATSD_BACKEND_VERSION}-#{RELEASE}_amd64.deb"
  File.unlink(output_filename) if File.exist?(output_filename)

  # Collect arguments to fpm
  fpm_args = %W{
    -t deb
    -s dir
    -n ne-statsd-backend
    -v #{NE_STATSD_BACKEND_VERSION}
    --iteration #{RELEASE}
    -C #{@tmpdir}
    -d statsd
    --deb-user root
    --deb-group root
    srv
  }.join(' ')

  # Shell out to fpm as it doesn't play nicely as a library
  sh "fpm #{fpm_args}"
  Rake::Task[:cleanup].invoke
end

# Sets up the temporary directory for the build
task :tmpdir do
  require 'tempfile'
  @tmpdir = Dir.mktmpdir()
end

# Creates the target directory for the "git archive" export of the repository
task :export_dir => :tmpdir do
  # statsd v0.2.0 only supports loading backends from its "backends" directory,
  # so install the ne-statsd-backend there
  @export_dir = File.join(@tmpdir, "srv/statsd/backends/ne-statsd-backend")
  FileUtils.mkdir_p(@export_dir)
end

# Exports a clean copy of the git repository
task :git_export => :export_dir do
  release_tag = "#{NE_STATSD_BACKEND_VERSION}-#{RELEASE_PREFIX}"
  sh "git archive #{release_tag} | tar -x -C #{@export_dir}"
end

# Cleans up the temporary directory containing the build
task :cleanup => :tmpdir do
  FileUtils.rm_rf(@tmpdir, :verbose => true)
end
